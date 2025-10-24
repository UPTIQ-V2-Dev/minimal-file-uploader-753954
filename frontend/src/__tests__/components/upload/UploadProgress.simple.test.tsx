import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UploadProgress } from '../../../components/upload/UploadProgress';

describe('UploadProgress - Simple Tests', () => {
    it('should display progress information', () => {
        render(
            <UploadProgress
                progress={50}
                filename='test.jpg'
            />
        );

        expect(screen.getByText('Uploading test.jpg')).toBeInTheDocument();
        expect(screen.getByText('50% complete')).toBeInTheDocument();
        expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('should show processing state at 100%', () => {
        render(
            <UploadProgress
                progress={100}
                filename='test.jpg'
            />
        );

        expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
});
