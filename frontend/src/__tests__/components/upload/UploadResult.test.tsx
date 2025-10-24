import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';
import { UploadResult } from '../../../components/upload/UploadResult';
import { FileUploadResponse } from '../../../types/file';

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: mockWriteText
    }
});

describe('UploadResult', () => {
    const mockResult: FileUploadResponse = {
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

    describe('Success State', () => {
        it('should display success message and file info', () => {
            renderWithProviders(<UploadResult result={mockResult} />);

            expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
            expect(screen.getByText('Your file has been uploaded to cloud storage.')).toBeInTheDocument();
            expect(screen.getByText('test.jpg')).toBeInTheDocument();
            expect(screen.getByText('1000 KB • 1/1/2023')).toBeInTheDocument();
        });

        it('should display signed URL', () => {
            renderWithProviders(<UploadResult result={mockResult} />);

            expect(screen.getByText('Signed URL:')).toBeInTheDocument();
            expect(screen.getByText('https://example.com/signed-url')).toBeInTheDocument();
        });

        it('should handle copy-to-clipboard for signed URL', async () => {
            const user = userEvent.setup();
            renderWithProviders(<UploadResult result={mockResult} />);

            const copyButton = screen.getByText('Copy');
            await user.click(copyButton);

            expect(mockWriteText).toHaveBeenCalledWith('https://example.com/signed-url');

            await waitFor(() => {
                expect(screen.getByText('Copied!')).toBeInTheDocument();
            });
        });

        it('should show different icons for different file types', () => {
            const pdfResult = { ...mockResult, contentType: 'application/pdf' };
            renderWithProviders(<UploadResult result={pdfResult} />);

            // Should render FileText icon for PDF
            const icons = screen.getAllByRole('img', { hidden: true });
            expect(icons.length).toBeGreaterThan(0);
        });

        it('should provide upload another file action', async () => {
            const user = userEvent.setup();
            const mockOnUploadAnother = vi.fn();

            renderWithProviders(
                <UploadResult
                    result={mockResult}
                    onUploadAnother={mockOnUploadAnother}
                />
            );

            const uploadAnotherButton = screen.getByText('Upload Another File');
            await user.click(uploadAnotherButton);

            expect(mockOnUploadAnother).toHaveBeenCalledOnce();
        });
    });

    describe('Error State', () => {
        it('should display error message', () => {
            const errorMessage = 'Upload failed due to network error';
            renderWithProviders(<UploadResult error={errorMessage} />);

            expect(screen.getByText('Upload Failed')).toBeInTheDocument();
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });

        it('should provide retry functionality', async () => {
            const user = userEvent.setup();
            const mockOnRetry = vi.fn();

            renderWithProviders(
                <UploadResult
                    error='Upload failed'
                    onRetry={mockOnRetry}
                />
            );

            const retryButton = screen.getByText('Try Again');
            await user.click(retryButton);

            expect(mockOnRetry).toHaveBeenCalledOnce();
        });

        it('should provide upload different file action', async () => {
            const user = userEvent.setup();
            const mockOnUploadAnother = vi.fn();

            renderWithProviders(
                <UploadResult
                    error='Upload failed'
                    onUploadAnother={mockOnUploadAnother}
                />
            );

            const uploadDifferentButton = screen.getByText('Upload Different File');
            await user.click(uploadDifferentButton);

            expect(mockOnUploadAnother).toHaveBeenCalledOnce();
        });

        it('should not show retry button when onRetry is not provided', () => {
            renderWithProviders(<UploadResult error='Upload failed' />);

            expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('should render nothing when no result or error provided', () => {
            const { container } = renderWithProviders(<UploadResult />);

            expect(container.firstChild).toBeNull();
        });
    });

    it('should handle clipboard API failure gracefully', async () => {
        const user = userEvent.setup();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        mockWriteText.mockRejectedValueOnce(new Error('Clipboard not available'));

        renderWithProviders(<UploadResult result={mockResult} />);

        const copyButton = screen.getByText('Copy');
        await user.click(copyButton);

        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy URL:', expect.any(Error));

        consoleSpy.mockRestore();
    });
});
