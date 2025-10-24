import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth';
import * as apiHelpers from '@/lib/api';
import { mockAuthResponse, mockValidLoginRequest, mockSignupRequest } from '@/__mocks__/authMocks';

// Mock the auth service
vi.mock('@/services/auth');

// Mock API helpers
vi.mock('@/lib/api', async () => {
    const actual = await vi.importActual('@/lib/api');
    return {
        ...actual,
        getStoredUser: vi.fn(),
        isAuthenticated: vi.fn(),
        clearAuthData: vi.fn()
    };
});

const mockAuthService = authService as any;
const mockApiHelpers = apiHelpers as any;

// Helper to render hook with QueryClient
const renderUseAuth = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    return renderHook(() => useAuth(), { wrapper });
};

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with correct default state', () => {
        mockApiHelpers.getStoredUser.mockReturnValue(null);
        mockApiHelpers.isAuthenticated.mockReturnValue(false);

        const { result } = renderUseAuth();

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoggingIn).toBe(false);
        expect(result.current.isRegistering).toBe(false);
        expect(result.current.isLoggingOut).toBe(false);
    });

    it('returns authenticated user when logged in', () => {
        mockApiHelpers.getStoredUser.mockReturnValue(mockAuthResponse.user);
        mockApiHelpers.isAuthenticated.mockReturnValue(true);

        const { result } = renderUseAuth();

        expect(result.current.user).toEqual(mockAuthResponse.user);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles successful login', async () => {
        mockApiHelpers.getStoredUser.mockReturnValue(null);
        mockApiHelpers.isAuthenticated.mockReturnValue(false);
        mockAuthService.login.mockResolvedValue(mockAuthResponse);

        const { result } = renderUseAuth();

        await result.current.login(mockValidLoginRequest);

        await waitFor(() => {
            expect(mockAuthService.login).toHaveBeenCalledWith(mockValidLoginRequest);
            expect(result.current.isLoggingIn).toBe(false);
        });
    });

    it('handles login failure', async () => {
        const loginError = new Error('Invalid credentials');
        mockApiHelpers.getStoredUser.mockReturnValue(null);
        mockApiHelpers.isAuthenticated.mockReturnValue(false);
        mockAuthService.login.mockRejectedValue(loginError);

        const { result } = renderUseAuth();

        await expect(result.current.login(mockValidLoginRequest)).rejects.toThrow('Invalid credentials');

        await waitFor(() => {
            expect(mockApiHelpers.clearAuthData).toHaveBeenCalled();
            expect(result.current.loginError).toEqual(loginError);
            expect(result.current.isLoggingIn).toBe(false);
        });
    });

    it('handles successful registration', async () => {
        mockApiHelpers.getStoredUser.mockReturnValue(null);
        mockApiHelpers.isAuthenticated.mockReturnValue(false);
        mockAuthService.register.mockResolvedValue(mockAuthResponse);

        const { result } = renderUseAuth();

        await result.current.register(mockSignupRequest);

        await waitFor(() => {
            expect(mockAuthService.register).toHaveBeenCalledWith(mockSignupRequest);
            expect(result.current.isRegistering).toBe(false);
        });
    });

    it('handles registration failure', async () => {
        const registrationError = new Error('Email already exists');
        mockApiHelpers.getStoredUser.mockReturnValue(null);
        mockApiHelpers.isAuthenticated.mockReturnValue(false);
        mockAuthService.register.mockRejectedValue(registrationError);

        const { result } = renderUseAuth();

        await expect(result.current.register(mockSignupRequest)).rejects.toThrow('Email already exists');

        await waitFor(() => {
            expect(result.current.registerError).toEqual(registrationError);
            expect(result.current.isRegistering).toBe(false);
        });
    });

    it('handles successful logout', async () => {
        mockApiHelpers.getStoredUser.mockReturnValue(mockAuthResponse.user);
        mockApiHelpers.isAuthenticated.mockReturnValue(true);
        mockAuthService.logout.mockResolvedValue(undefined);

        const { result } = renderUseAuth();

        await result.current.logout();

        await waitFor(() => {
            expect(mockAuthService.logout).toHaveBeenCalled();
            expect(result.current.isLoggingOut).toBe(false);
        });
    });

    it('handles logout failure and clears auth data anyway', async () => {
        const logoutError = new Error('Logout failed');
        mockApiHelpers.getStoredUser.mockReturnValue(mockAuthResponse.user);
        mockApiHelpers.isAuthenticated.mockReturnValue(true);
        mockAuthService.logout.mockRejectedValue(logoutError);

        const { result } = renderUseAuth();

        await expect(result.current.logout()).rejects.toThrow('Logout failed');

        await waitFor(() => {
            expect(mockApiHelpers.clearAuthData).toHaveBeenCalled();
            expect(result.current.logoutError).toEqual(logoutError);
            expect(result.current.isLoggingOut).toBe(false);
        });
    });

    it('shows correct loading states', async () => {
        mockApiHelpers.getStoredUser.mockReturnValue(null);
        mockApiHelpers.isAuthenticated.mockReturnValue(false);
        mockAuthService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        const { result } = renderUseAuth();

        // Start login
        result.current.login(mockValidLoginRequest);

        await waitFor(() => {
            expect(result.current.isLoggingIn).toBe(true);
        });
    });

    it('clears query cache on logout success', async () => {
        mockApiHelpers.getStoredUser.mockReturnValue(mockAuthResponse.user);
        mockApiHelpers.isAuthenticated.mockReturnValue(true);
        mockAuthService.logout.mockResolvedValue(undefined);

        const { result } = renderUseAuth();

        await result.current.logout();

        await waitFor(() => {
            expect(mockAuthService.logout).toHaveBeenCalled();
        });
    });

    it('handles authentication state management correctly', () => {
        // Test unauthenticated state
        mockApiHelpers.getStoredUser.mockReturnValue(null);
        mockApiHelpers.isAuthenticated.mockReturnValue(false);

        const { result, rerender } = renderUseAuth();

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);

        // Update to authenticated state
        mockApiHelpers.getStoredUser.mockReturnValue(mockAuthResponse.user);
        mockApiHelpers.isAuthenticated.mockReturnValue(true);

        rerender();

        expect(result.current.user).toEqual(mockAuthResponse.user);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('provides error states for all operations', async () => {
        mockApiHelpers.getStoredUser.mockReturnValue(null);
        mockApiHelpers.isAuthenticated.mockReturnValue(false);

        const { result } = renderUseAuth();

        // Initially no errors
        expect(result.current.loginError).toBeNull();
        expect(result.current.registerError).toBeNull();
        expect(result.current.logoutError).toBeNull();

        // Test login error
        const loginError = new Error('Login failed');
        mockAuthService.login.mockRejectedValue(loginError);

        await expect(result.current.login(mockValidLoginRequest)).rejects.toThrow();

        await waitFor(() => {
            expect(result.current.loginError).toEqual(loginError);
        });
    });
});
