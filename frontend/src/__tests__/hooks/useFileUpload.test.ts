import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, createElement } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { createMockFile } from '../../__mocks__/fileMocks';
import * as fileService from '../../services/fileService';

// Mock the file service
vi.mock('../../services/fileService');

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

interface WrapperProps {
    children: ReactNode;
}

const createWrapper = () => {
    const testQueryClient = createTestQueryClient();

    return ({ children }: WrapperProps) => createElement(QueryClientProvider, { client: testQueryClient }, children);
};

describe('useFileUpload', () => {
    const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024000);
    const mockUploadResponse = {
        id: 'test-id',
        filename: 'test.jpg',
        signedUrl: 'https://example.com/signed-url',
        contentType: 'image/jpeg',
        size: 1024000,
        uploadedAt: '2023-01-01T00:00:00Z'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with idle state', () => {
        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        expect(result.current.uploadState).toEqual({
            status: 'idle',
            progress: 0,
            file: null,
            result: null,
            error: null
        });
        expect(result.current.isUploading).toBe(false);
    });

    it('should select file and update state', () => {
        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        result.current.selectFile(mockFile);

        expect(result.current.uploadState.file).toEqual(mockFile);
        expect(result.current.uploadState.status).toBe('idle');
    });

    it('should handle successful upload', async () => {
        vi.mocked(fileService.uploadFile).mockResolvedValue(mockUploadResponse);

        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        result.current.selectFile(mockFile);
        result.current.startUpload();

        // Check uploading state
        expect(result.current.uploadState.status).toBe('uploading');
        expect(result.current.isUploading).toBe(true);

        await waitFor(() => {
            expect(result.current.uploadState.status).toBe('success');
        });

        expect(result.current.uploadState.result).toEqual(mockUploadResponse);
        expect(result.current.uploadState.error).toBeNull();
        expect(result.current.isUploading).toBe(false);
    });

    it('should handle upload error', async () => {
        const errorMessage = 'Upload failed';
        vi.mocked(fileService.uploadFile).mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        result.current.selectFile(mockFile);
        result.current.startUpload();

        await waitFor(() => {
            expect(result.current.uploadState.status).toBe('error');
        });

        expect(result.current.uploadState.error).toBe(errorMessage);
        expect(result.current.uploadState.result).toBeNull();
        expect(result.current.isUploading).toBe(false);
    });

    it('should track upload progress', async () => {
        vi.mocked(fileService.uploadFile).mockImplementation(async (file, onProgress) => {
            if (onProgress) {
                onProgress(50);
                onProgress(100);
            }
            return mockUploadResponse;
        });

        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        result.current.selectFile(mockFile);
        result.current.startUpload();

        await waitFor(() => {
            expect(result.current.uploadState.status).toBe('success');
        });

        // Progress should have been updated during upload
        expect(result.current.uploadState.progress).toBe(100);
    });

    it('should retry upload after error', async () => {
        vi.mocked(fileService.uploadFile)
            .mockRejectedValueOnce(new Error('First attempt failed'))
            .mockResolvedValueOnce(mockUploadResponse);

        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        result.current.selectFile(mockFile);
        result.current.startUpload();

        await waitFor(() => {
            expect(result.current.uploadState.status).toBe('error');
        });

        // Retry the upload
        result.current.retry();

        await waitFor(() => {
            expect(result.current.uploadState.status).toBe('success');
        });

        expect(result.current.uploadState.result).toEqual(mockUploadResponse);
    });

    it('should reset state', () => {
        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        result.current.selectFile(mockFile);
        result.current.reset();

        expect(result.current.uploadState).toEqual({
            status: 'idle',
            progress: 0,
            file: null,
            result: null,
            error: null
        });
    });

    it('should cancel upload', () => {
        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        result.current.selectFile(mockFile);
        result.current.startUpload();
        result.current.cancel();

        expect(result.current.uploadState.status).toBe('idle');
        expect(result.current.uploadState.progress).toBe(0);
    });

    it('should handle upload without file selected', () => {
        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        result.current.startUpload();

        // Should remain in idle state since no file is selected
        expect(result.current.uploadState.status).toBe('idle');
    });

    it('should handle retry without file selected', () => {
        const { result } = renderHook(() => useFileUpload(), {
            wrapper: createWrapper()
        });

        result.current.retry();

        // Should remain in idle state since no file is selected
        expect(result.current.uploadState.status).toBe('idle');
    });
});
