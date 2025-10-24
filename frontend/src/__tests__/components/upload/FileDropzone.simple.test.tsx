import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileDropzone } from '../../../components/upload/FileDropzone';

// Simple tests without complex interactions
describe('FileDropzone - Simple Tests', () => {
    it('should render basic elements', () => {
        const mockOnFileSelect = vi.fn();

        render(<FileDropzone onFileSelect={mockOnFileSelect} />);

        expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
        expect(screen.getByText('Supports JPG, PNG, GIF, PDF • Max 5MB')).toBeInTheDocument();
    });

    it('should show disabled state when disabled', () => {
        const mockOnFileSelect = vi.fn();

        render(
            <FileDropzone
                onFileSelect={mockOnFileSelect}
                disabled={true}
            />
        );

        const input = screen.getByLabelText('Select file to upload');
        expect(input).toBeDisabled();
    });
});
