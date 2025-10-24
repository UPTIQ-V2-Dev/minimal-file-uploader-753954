import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { clearAuthData, getStoredUser, isAuthenticated } from '@/lib/api';
import type { AuthResponse, LoginRequest, SignupRequest, User } from '@/types/user';

const AUTH_QUERY_KEY = 'auth';

export const useAuth = () => {
    const queryClient = useQueryClient();

    // Query to get current user authentication status
    const {
        data: user,
        isLoading: isAuthLoading,
        error: authError
    } = useQuery({
        queryKey: [AUTH_QUERY_KEY],
        queryFn: (): User | null => getStoredUser(),
        staleTime: Infinity, // Don't refetch automatically
        retry: false
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: (credentials: LoginRequest): Promise<AuthResponse> => authService.login(credentials),
        onSuccess: (data: AuthResponse) => {
            queryClient.setQueryData([AUTH_QUERY_KEY], data.user);
        },
        onError: error => {
            console.error('Login failed:', error);
            clearAuthData();
        }
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: (userData: SignupRequest): Promise<AuthResponse> => authService.register(userData),
        onSuccess: (data: AuthResponse) => {
            queryClient.setQueryData([AUTH_QUERY_KEY], data.user);
        },
        onError: error => {
            console.error('Registration failed:', error);
        }
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: (): Promise<void> => authService.logout(),
        onSuccess: () => {
            queryClient.setQueryData([AUTH_QUERY_KEY], null);
            queryClient.clear(); // Clear all cached data
        },
        onError: error => {
            console.error('Logout failed:', error);
            // Clear auth data even if logout fails
            clearAuthData();
            queryClient.setQueryData([AUTH_QUERY_KEY], null);
        }
    });

    const login = (credentials: LoginRequest) => {
        return loginMutation.mutateAsync(credentials);
    };

    const register = (userData: SignupRequest) => {
        return registerMutation.mutateAsync(userData);
    };

    const logout = () => {
        return logoutMutation.mutateAsync();
    };

    return {
        // Auth state
        user,
        isAuthenticated: isAuthenticated(),
        isAuthLoading,
        authError,

        // Auth actions
        login,
        register,
        logout,

        // Loading states
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
        isLoggingOut: logoutMutation.isPending,

        // Error states
        loginError: loginMutation.error,
        registerError: registerMutation.error,
        logoutError: logoutMutation.error
    };
};
