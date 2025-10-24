import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';
import { FileDropzone } from '../../../components/upload/FileDropzone';
import { createMockFile, validImageFile, oversizedFile, invalidTypeFile } from '../../../__mocks__/fileMocks';

describe('FileDropzone', () => {
    const mockOnFileSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render drop zone correctly', () => {
        renderWithProviders(<FileDropzone onFileSelect={mockOnFileSelect} />);

        expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
        expect(screen.getByText('Supports JPG, PNG, GIF, PDF • Max 5MB')).toBeInTheDocument();
        expect(screen.getByLabelText('Select file to upload')).toBeInTheDocument();
    });

    it('should handle file selection via input', async () => {
        const user = userEvent.setup();
        renderWithProviders(<FileDropzone onFileSelect={mockOnFileSelect} />);

        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, validImageFile);

        expect(mockOnFileSelect).toHaveBeenCalledWith(validImageFile);
    });

    it('should handle drag and drop events', async () => {
        renderWithProviders(<FileDropzone onFileSelect={mockOnFileSelect} />);

        const dropzone = screen.getByText('Drop your file here or click to browse').closest('div');

        // Simulate drag over
        fireEvent.dragOver(dropzone!, {
            dataTransfer: {
                files: [validImageFile]
            }
        });

        // Simulate drop
        fireEvent.drop(dropzone!, {
            dataTransfer: {
                files: [validImageFile]
            }
        });

        expect(mockOnFileSelect).toHaveBeenCalledWith(validImageFile);
    });

    it('should validate file types and show error for invalid types', async () => {
        const user = userEvent.setup();
        renderWithProviders(<FileDropzone onFileSelect={mockOnFileSelect} />);

        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, invalidTypeFile);

        await waitFor(() => {
            expect(screen.getByText('Only JPG, PNG, GIF, and PDF files are allowed')).toBeInTheDocument();
        });

        expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should validate file size and show error for oversized files', async () => {
        const user = userEvent.setup();
        renderWithProviders(<FileDropzone onFileSelect={mockOnFileSelect} />);

        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, oversizedFile);

        await waitFor(() => {
            expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
        });

        expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should allow clearing error messages', async () => {
        const user = userEvent.setup();
        renderWithProviders(<FileDropzone onFileSelect={mockOnFileSelect} />);

        const input = screen.getByLabelText('Select file to upload');
        await user.upload(input, oversizedFile);

        await waitFor(() => {
            expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
        });

        const clearButton = screen.getByLabelText('Clear error');
        await user.click(clearButton);

        expect(screen.queryByText('File size must be less than 5MB')).not.toBeInTheDocument();
    });

    it('should disable when disabled prop is true', () => {
        renderWithProviders(
            <FileDropzone
                onFileSelect={mockOnFileSelect}
                disabled={true}
            />
        );

        const input = screen.getByLabelText('Select file to upload');
        expect(input).toBeDisabled();
    });

    it('should not handle drag events when disabled', () => {
        renderWithProviders(
            <FileDropzone
                onFileSelect={mockOnFileSelect}
                disabled={true}
            />
        );

        const dropzone = screen.getByText('Drop your file here or click to browse').closest('div');

        fireEvent.drop(dropzone!, {
            dataTransfer: {
                files: [validImageFile]
            }
        });

        expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should accept multiple valid file types', async () => {
        const user = userEvent.setup();
        renderWithProviders(<FileDropzone onFileSelect={mockOnFileSelect} />);

        const input = screen.getByLabelText('Select file to upload');

        // Test different valid file types
        const jpgFile = createMockFile('test.jpg', 'image/jpeg', 1024);
        const pngFile = createMockFile('test.png', 'image/png', 1024);
        const gifFile = createMockFile('test.gif', 'image/gif', 1024);
        const pdfFile = createMockFile('test.pdf', 'application/pdf', 1024);

        await user.upload(input, jpgFile);
        expect(mockOnFileSelect).toHaveBeenCalledWith(jpgFile);

        await user.upload(input, pngFile);
        expect(mockOnFileSelect).toHaveBeenCalledWith(pngFile);

        await user.upload(input, gifFile);
        expect(mockOnFileSelect).toHaveBeenCalledWith(gifFile);

        await user.upload(input, pdfFile);
        expect(mockOnFileSelect).toHaveBeenCalledWith(pdfFile);
    });
});
