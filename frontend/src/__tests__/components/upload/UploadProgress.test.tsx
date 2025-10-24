import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';
import { UploadProgress } from '../../../components/upload/UploadProgress';

describe('UploadProgress', () => {
    it('should show progress percentage', () => {
        renderWithProviders(
            <UploadProgress
                progress={50}
                filename='test.jpg'
            />
        );

        expect(screen.getByText('50% complete')).toBeInTheDocument();
        expect(screen.getByLabelText('Upload progress: 50%')).toBeInTheDocument();
    });

    it('should display filename', () => {
        renderWithProviders(
            <UploadProgress
                progress={25}
                filename='document.pdf'
            />
        );

        expect(screen.getByText('Uploading document.pdf')).toBeInTheDocument();
    });

    it('should show uploading status when progress < 100', () => {
        renderWithProviders(
            <UploadProgress
                progress={75}
                filename='test.jpg'
            />
        );

        expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('should show processing status when progress is 100', () => {
        renderWithProviders(
            <UploadProgress
                progress={100}
                filename='test.jpg'
            />
        );

        expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should handle cancel action when onCancel is provided', async () => {
        const user = userEvent.setup();
        const mockOnCancel = vi.fn();

        renderWithProviders(
            <UploadProgress
                progress={50}
                filename='test.jpg'
                onCancel={mockOnCancel}
            />
        );

        const cancelButton = screen.getByLabelText('Cancel upload');
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    it('should not show cancel button when onCancel is not provided', () => {
        renderWithProviders(
            <UploadProgress
                progress={50}
                filename='test.jpg'
            />
        );

        expect(screen.queryByLabelText('Cancel upload')).not.toBeInTheDocument();
    });

    it('should display loading animation', () => {
        renderWithProviders(
            <UploadProgress
                progress={30}
                filename='test.jpg'
            />
        );

        const loader = screen.getByRole('img', { hidden: true }); // Lucide icons have img role
        expect(loader).toBeInTheDocument();
    });

    it('should show different progress values correctly', () => {
        const { rerender } = renderWithProviders(
            <UploadProgress
                progress={0}
                filename='test.jpg'
            />
        );

        expect(screen.getByText('0% complete')).toBeInTheDocument();

        rerender(
            <UploadProgress
                progress={50}
                filename='test.jpg'
            />
        );

        expect(screen.getByText('50% complete')).toBeInTheDocument();

        rerender(
            <UploadProgress
                progress={100}
                filename='test.jpg'
            />
        );

        expect(screen.getByText('100% complete')).toBeInTheDocument();
    });
});
