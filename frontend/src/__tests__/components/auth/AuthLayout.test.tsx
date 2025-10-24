import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthLayout } from '@/components/auth/AuthLayout';

describe('AuthLayout', () => {
    it('renders layout structure correctly', () => {
        render(
            <AuthLayout title='Test Title'>
                <div>Test Content</div>
            </AuthLayout>
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders title and description when both are provided', () => {
        render(
            <AuthLayout
                title='Login'
                description='Enter your credentials'
            >
                <div>Form content</div>
            </AuthLayout>
        );

        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Enter your credentials')).toBeInTheDocument();
    });

    it('renders without description when not provided', () => {
        render(
            <AuthLayout title='Login'>
                <div>Form content</div>
            </AuthLayout>
        );

        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.queryByText('Enter your credentials')).not.toBeInTheDocument();
    });

    it('renders children content correctly', () => {
        const testContent = 'This is test children content';
        render(
            <AuthLayout title='Test'>
                <div data-testid='children'>{testContent}</div>
            </AuthLayout>
        );

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('applies proper CSS classes for responsive design', () => {
        render(
            <AuthLayout title='Test'>
                <div>Content</div>
            </AuthLayout>
        );

        // Check main container has responsive classes
        const container = screen.getByText('Test').closest('.min-h-screen');
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('flex', 'items-center', 'justify-center');
    });
});
