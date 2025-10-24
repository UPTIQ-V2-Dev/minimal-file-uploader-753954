import { mockAuthResponse } from '@/data/mockData';
import { api, clearAuthData, getStoredRefreshToken, setAuthData } from '@/lib/api';
import { mockApiDelay } from '@/lib/utils';
import type { AuthResponse, LoginRequest, SignupRequest } from '@/types/user';

export const authService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: login ---', credentials);
            await mockApiDelay();
            return mockAuthResponse;
        }

        try {
            const response = await api.post('/auth/login', credentials);
            console.log('response in login', response);
            setAuthData(response.data);
            return response.data;
        } catch (error: any) {
            // Fallback to mock data on network errors (502, 503, 504, connection errors)
            if (error.response?.status >= 500 || error.code === 'NETWORK_ERROR' || !error.response) {
                console.log('--- API UNAVAILABLE: Using mock data for login ---', credentials);
                await mockApiDelay();
                setAuthData(mockAuthResponse);
                return mockAuthResponse;
            }
            throw error;
        }
    },

    register: async (userData: SignupRequest): Promise<AuthResponse> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: register ---', userData);
            await mockApiDelay();
            return mockAuthResponse;
        }

        try {
            const response = await api.post('/auth/register', userData);
            setAuthData(response.data);
            return response.data;
        } catch (error: any) {
            // Fallback to mock data on network errors (502, 503, 504, connection errors)
            if (error.response?.status >= 500 || error.code === 'NETWORK_ERROR' || !error.response) {
                console.log('--- API UNAVAILABLE: Using mock data for register ---', userData);
                await mockApiDelay();
                setAuthData(mockAuthResponse);
                return mockAuthResponse;
            }
            throw error;
        }
    },

    refreshToken: async (): Promise<AuthResponse> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: refreshToken ---');
            await mockApiDelay();
            return mockAuthResponse;
        }

        try {
            const response = await api.post('/auth/refresh');
            setAuthData(response.data);
            return response.data;
        } catch (error: any) {
            // Fallback to mock data on network errors (502, 503, 504, connection errors)
            if (error.response?.status >= 500 || error.code === 'NETWORK_ERROR' || !error.response) {
                console.log('--- API UNAVAILABLE: Using mock data for refreshToken ---');
                await mockApiDelay();
                setAuthData(mockAuthResponse);
                return mockAuthResponse;
            }
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
            console.log('--- MOCK API: logout ---');
            await mockApiDelay();
            clearAuthData();
            return;
        }

        const refreshToken = getStoredRefreshToken();
        if (!refreshToken) {
            // If no refresh token, just clear local data
            clearAuthData();
            return;
        }

        try {
            await api.post('/auth/logout', { refreshToken });
            clearAuthData();
        } catch (error: any) {
            // Fallback to clearing local data on network errors
            if (error.response?.status >= 500 || error.code === 'NETWORK_ERROR' || !error.response) {
                console.log('--- API UNAVAILABLE: Clearing auth data locally for logout ---');
                clearAuthData();
                return;
            }
            // For other errors, still clear local data but propagate the error
            clearAuthData();
            throw error;
        }
    }
};
