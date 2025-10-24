import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '@/pages/LoginPage';
import { useAuth } from '@/hooks/useAuth';
import { mockValidLoginRequest } from '@/__mocks__/authMocks';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth');

const mockUseAuth = useAuth as any;

// Helper to render LoginPage with required providers
const renderLoginPage = (initialEntries = ['/login']) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        </QueryClientProvider>
    );
};

// Mock navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: { from: { pathname: '/dashboard' } } })
    };
});

describe('LoginPage', () => {
    const mockLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            isLoggingIn: false,
            loginError: null
        });
    });

    it('renders login page correctly', () => {
        renderLoginPage();

        expect(screen.getByText('Welcome back')).toBeInTheDocument();
        expect(screen.getByText('Enter your credentials to access your account')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('handles successful login and redirects', async () => {
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({ success: true });

        renderLoginPage();

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, mockValidLoginRequest.email);
        await user.type(passwordInput, mockValidLoginRequest.password);
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: mockValidLoginRequest.email,
                password: mockValidLoginRequest.password
            });
        });
    });

    it('redirects to home when already authenticated', () => {
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isAuthenticated: true,
            isLoggingIn: false,
            loginError: null
        });

        renderLoginPage();

        // The redirect happens via useEffect, so we need to wait
        expect(mockNavigate).toHaveBeenCalled();
    });

    it('displays loading state during login', () => {
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            isLoggingIn: true,
            loginError: null
        });

        renderLoginPage();

        expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /signing in.../i })).toBeDisabled();
    });

    it('displays error message on login failure', () => {
        const errorMessage = 'Invalid credentials';
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            isLoggingIn: false,
            loginError: { response: { data: { message: errorMessage } } }
        });

        renderLoginPage();

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('displays network error message', () => {
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            isLoggingIn: false,
            loginError: { message: 'Network Error' }
        });

        renderLoginPage();

        expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('displays 401 error message', () => {
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            isLoggingIn: false,
            loginError: { response: { status: 401 } }
        });

        renderLoginPage();

        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    it('displays server error message', () => {
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            isLoggingIn: false,
            loginError: { response: { status: 500 } }
        });

        renderLoginPage();

        expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });

    it('displays generic error message for unknown errors', () => {
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            isAuthenticated: false,
            isLoggingIn: false,
            loginError: { message: 'Unknown error' }
        });

        renderLoginPage();

        expect(screen.getByText(/unknown error/i)).toBeInTheDocument();
    });

    it('handles form submission with remember me', async () => {
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({ success: true });

        renderLoginPage();

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, mockValidLoginRequest.email);
        await user.type(passwordInput, mockValidLoginRequest.password);
        await user.click(rememberMeCheckbox);
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: mockValidLoginRequest.email,
                password: mockValidLoginRequest.password
            });
        });
    });

    it('handles login failure gracefully', async () => {
        const user = userEvent.setup();
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockLogin.mockRejectedValueOnce(new Error('Login failed'));

        renderLoginPage();

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await user.type(emailInput, mockValidLoginRequest.email);
        await user.type(passwordInput, mockValidLoginRequest.password);
        await user.click(submitButton);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error));
        });

        consoleErrorSpy.mockRestore();
    });
});
