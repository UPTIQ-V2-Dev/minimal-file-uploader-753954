import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
    });

    it('renders form fields correctly', () => {
        render(<LoginForm onSubmit={mockOnSubmit} />);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('validates email format', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        const emailInput = screen.getByLabelText(/email/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'invalid-email');
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates password requirements', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, '123'); // Too short
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows required field errors when fields are empty', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/email is required/i)).toBeInTheDocument();
            expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('handles form submission with valid data', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');
        await user.click(rememberMeCheckbox);
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                rememberMe: true
            });
        });
    });

    it('shows password toggle functionality', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        const passwordInput = screen.getByLabelText(/password/i);
        const toggleButton = screen.getByRole('button', { name: /show password/i });

        expect(passwordInput).toHaveAttribute('type', 'password');

        await user.click(toggleButton);

        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    });

    it('disables form during loading state', () => {
        render(
            <LoginForm
                onSubmit={mockOnSubmit}
                isLoading={true}
            />
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
        const submitButton = screen.getByRole('button', { name: /signing in.../i });

        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(rememberMeCheckbox).toBeDisabled();
        expect(submitButton).toBeDisabled();
    });

    it('shows loading spinner during loading state', () => {
        render(
            <LoginForm
                onSubmit={mockOnSubmit}
                isLoading={true}
            />
        );

        expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
        // Check for loading spinner icon
        const button = screen.getByRole('button', { name: /signing in.../i });
        expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
        const errorMessage = 'Invalid credentials';
        render(
            <LoginForm
                onSubmit={mockOnSubmit}
                error={errorMessage}
            />
        );

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not display error alert when no error', () => {
        render(<LoginForm onSubmit={mockOnSubmit} />);

        // Should not have any error alerts
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('remember me checkbox works correctly', async () => {
        const user = userEvent.setup();
        render(<LoginForm onSubmit={mockOnSubmit} />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, 'test@example.com');
        await user.type(passwordInput, 'password123');

        // Don't check remember me
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                rememberMe: false
            });
        });
    });
});
