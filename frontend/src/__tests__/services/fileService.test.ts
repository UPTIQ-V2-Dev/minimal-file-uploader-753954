import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFile, getFile, updateFile } from '../../services/fileService';
import { createMockFile } from '../../__mocks__/fileMocks';

// Mock the environment variable
vi.stubGlobal('import.meta', {
    env: {
        VITE_USE_MOCK_DATA: 'true'
    }
});

describe('fileService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadFile', () => {
        it('should upload file and return signed URL when using mock data', async () => {
            const file = createMockFile('test.jpg', 'image/jpeg', 1024000);
            const onProgress = vi.fn();

            const result = await uploadFile(file, onProgress);

            expect(result).toEqual({
                id: 'mock-file-id-123',
                filename: 'test.jpg',
                signedUrl: 'https://mock-cloud-storage.example.com/signed-url-12345',
                contentType: 'image/jpeg',
                size: 1024000,
                uploadedAt: expect.any(String)
            });

            // Verify progress callback was called
            expect(onProgress).toHaveBeenCalled();
        });

        it('should handle PDF files correctly', async () => {
            const file = createMockFile('test.pdf', 'application/pdf', 2048000);

            const result = await uploadFile(file);

            expect(result.filename).toBe('test.pdf');
            expect(result.contentType).toBe('application/pdf');
            expect(result.size).toBe(2048000);
            expect(result.signedUrl).toBeDefined();
        });

        it('should track upload progress', async () => {
            const file = createMockFile('test.jpg', 'image/jpeg', 1024000);
            const onProgress = vi.fn();

            await uploadFile(file, onProgress);

            // Progress should be called multiple times during mock upload
            expect(onProgress).toHaveBeenCalled();
        });
    });

    describe('getFile', () => {
        it('should retrieve file by ID when using mock data', async () => {
            const result = await getFile('test-id');

            expect(result).toEqual({
                id: 'test-id',
                filename: 'example-file.jpg',
                signedUrl: 'https://mock-cloud-storage.example.com/signed-url-12345',
                contentType: 'image/jpeg',
                size: 1024000,
                uploadedAt: expect.any(String)
            });
        });
    });

    describe('updateFile', () => {
        it('should update file and return new signed URL when using mock data', async () => {
            const file = createMockFile('updated.pdf', 'application/pdf', 1536000);

            const result = await updateFile('test-id', file);

            expect(result).toEqual({
                id: 'test-id',
                filename: 'updated.pdf',
                signedUrl: 'https://mock-cloud-storage.example.com/signed-url-12345',
                contentType: 'application/pdf',
                size: 1536000,
                uploadedAt: expect.any(String)
            });
        });
    });
});
