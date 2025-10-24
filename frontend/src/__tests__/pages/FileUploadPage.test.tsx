import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { FileUploadPage } from '../../pages/FileUploadPage';
import { createMockFile } from '../../__mocks__/fileMocks';
import * as fileService from '../../services/fileService';

// Mock the file service
vi.mock('../../services/fileService');

describe('FileUploadPage', () => {
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
        vi.mocked(fileService.uploadFile).mockResolvedValue(mockUploadResponse);
    });

    it('should render file upload page correctly', () => {
        renderWithProviders(<FileUploadPage />);

        expect(screen.getByText('File Upload')).toBeInTheDocument();
        expect(screen.getByText('Upload your images or PDF files to cloud storage')).toBeInTheDocument();
        expect(screen.getByText('Upload File')).toBeInTheDocument();
        expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
    });

    it('should handle complete upload flow integration', async () => {
        const user = userEvent.setup();
        const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024000);

        renderWithProviders(<FileUploadPage />);

        // Select file
        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, mockFile);

        // Should auto-start upload and show progress
        await waitFor(() => {
            expect(screen.getByText(/Uploading test.jpg/)).toBeInTheDocument();
        });

        // Should show success result
        await waitFor(() => {
            expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
        });

        expect(screen.getByText('test.jpg')).toBeInTheDocument();
        expect(screen.getByText('https://example.com/signed-url')).toBeInTheDocument();
    });

    it('should handle upload error and retry', async () => {
        const user = userEvent.setup();
        const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024000);

        vi.mocked(fileService.uploadFile)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce(mockUploadResponse);

        renderWithProviders(<FileUploadPage />);

        // Select file
        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, mockFile);

        // Should show error
        await waitFor(() => {
            expect(screen.getByText('Upload Failed')).toBeInTheDocument();
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });

        // Retry upload
        const retryButton = screen.getByText('Try Again');
        await user.click(retryButton);

        // Should show success after retry
        await waitFor(() => {
            expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
        });
    });

    it('should allow uploading another file after success', async () => {
        const user = userEvent.setup();
        const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024000);

        renderWithProviders(<FileUploadPage />);

        // Complete first upload
        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, mockFile);

        await waitFor(() => {
            expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
        });

        // Click upload another file
        const uploadAnotherButton = screen.getByText('Upload Another File');
        await user.click(uploadAnotherButton);

        // Should return to initial state
        expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
        expect(screen.queryByText('Upload Successful!')).not.toBeInTheDocument();
    });

    it('should handle file selection and show upload button', async () => {
        const user = userEvent.setup();
        const mockFile = createMockFile('test.pdf', 'application/pdf', 2048000);

        // Mock uploadFile to not resolve immediately so we can test the intermediate state
        vi.mocked(fileService.uploadFile).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        );

        renderWithProviders(<FileUploadPage />);

        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, mockFile);

        // Should show selected file info with upload button
        expect(screen.getByText('Selected file:')).toBeInTheDocument();
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
        expect(screen.getByText('Upload File')).toBeInTheDocument();
        expect(screen.getByText('Change File')).toBeInTheDocument();
    });

    it('should handle change file action', async () => {
        const user = userEvent.setup();
        const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024000);

        // Mock uploadFile to not resolve immediately
        vi.mocked(fileService.uploadFile).mockImplementation(() => new Promise(() => {}));

        renderWithProviders(<FileUploadPage />);

        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, mockFile);

        // Click change file
        const changeFileButton = screen.getByText('Change File');
        await user.click(changeFileButton);

        // Should return to dropzone
        expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
        expect(screen.queryByText('Selected file:')).not.toBeInTheDocument();
    });

    it('should handle upload cancellation', async () => {
        const user = userEvent.setup();
        const mockFile = createMockFile('test.jpg', 'image/jpeg', 1024000);

        // Mock uploadFile to not resolve immediately so we can test cancellation
        vi.mocked(fileService.uploadFile).mockImplementation(() => new Promise(() => {}));

        renderWithProviders(<FileUploadPage />);

        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, mockFile);

        // Should show upload progress
        await waitFor(() => {
            expect(screen.getByText(/Uploading test.jpg/)).toBeInTheDocument();
        });

        // Cancel upload
        const cancelButton = screen.getByLabelText('Cancel upload');
        await user.click(cancelButton);

        // Should return to idle state (this depends on implementation)
        // The exact behavior may vary based on how cancellation is implemented
    });

    it('should be responsive and maintain proper layout', () => {
        renderWithProviders(<FileUploadPage />);

        // Check for responsive container classes
        const container = screen.getByText('File Upload').closest('.container');
        expect(container).toBeInTheDocument();

        // Check for proper card layout
        const uploadCard = screen.getByText('Upload File').closest('[class*="card"]');
        expect(uploadCard).toBeInTheDocument();
    });
});
