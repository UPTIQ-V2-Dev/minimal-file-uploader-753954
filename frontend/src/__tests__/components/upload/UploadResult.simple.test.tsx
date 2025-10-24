import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UploadResult } from '../../../components/upload/UploadResult';
import { FileUploadResponse } from '../../../types/file';

describe('UploadResult - Simple Tests', () => {
    const mockResult: FileUploadResponse = {
        id: 'test-id',
        filename: 'test.jpg',
        signedUrl: 'https://example.com/signed-url',
        contentType: 'image/jpeg',
        size: 1024000,
        uploadedAt: '2023-01-01T00:00:00Z'
    };

    it('should display success state', () => {
        render(<UploadResult result={mockResult} />);

        expect(screen.getByText('Upload Successful!')).toBeInTheDocument();
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
        expect(screen.getByText('Signed URL:')).toBeInTheDocument();
    });

    it('should display error state', () => {
        render(<UploadResult error='Upload failed' />);

        expect(screen.getByText('Upload Failed')).toBeInTheDocument();
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });

    it('should render nothing when no props provided', () => {
        const { container } = render(<UploadResult />);
        expect(container.firstChild).toBeNull();
    });
});
