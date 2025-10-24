import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import type { LoginRequest } from '@/types/user';

export const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoggingIn, loginError } = useAuth();

    // Get the redirect path from state or default to home
    const from = location.state?.from?.pathname || '/';

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleLogin = async (values: LoginRequest & { rememberMe: boolean }) => {
        try {
            await login({
                email: values.email,
                password: values.password
            });

            // Navigation will happen automatically due to the useEffect above
        } catch (error) {
            // Error is handled by the useAuth hook and displayed in the form
            console.error('Login failed:', error);
        }
    };

    const getErrorMessage = (error: any): string => {
        if (!error) return '';

        // Handle axios errors
        if (error.response?.data?.message) {
            return error.response.data.message;
        }

        // Handle network errors
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
            return 'Network error. Please check your connection and try again.';
        }

        // Handle other axios errors
        if (error.response?.status === 401) {
            return 'Invalid email or password. Please try again.';
        }

        if (error.response?.status >= 500) {
            return 'Server error. Please try again later.';
        }

        // Fallback error message
        return error.message || 'An unexpected error occurred. Please try again.';
    };

    return (
        <AuthLayout
            title='Welcome back'
            description='Enter your credentials to access your account'
        >
            <LoginForm
                onSubmit={handleLogin}
                isLoading={isLoggingIn}
                error={getErrorMessage(loginError)}
            />
        </AuthLayout>
    );
};
