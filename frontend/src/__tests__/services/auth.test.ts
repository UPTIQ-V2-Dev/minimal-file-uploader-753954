import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { authService } from '@/services/auth';
import {
    mockValidLoginRequest,
    mockInvalidLoginRequest,
    mockSignupRequest,
    mockAuthResponse
} from '@/__mocks__/authMocks';
import * as apiHelpers from '@/lib/api';

// Mock API helpers
vi.mock('@/lib/api', async () => {
    const actual = await vi.importActual('@/lib/api');
    return {
        ...actual,
        setAuthData: vi.fn(),
        clearAuthData: vi.fn(),
        getStoredRefreshToken: vi.fn()
    };
});

const mockApiHelpers = apiHelpers as any;

// Setup MSW server with handlers
const server = setupServer(
    http.post('/api/v1/auth/login', async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        const { email, password } = body;

        if (email !== mockValidLoginRequest.email || password !== mockValidLoginRequest.password) {
            return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }

        return HttpResponse.json(mockAuthResponse);
    }),

    http.post('/api/v1/auth/register', async () => {
        return HttpResponse.json(mockAuthResponse);
    }),

    http.post('/api/v1/auth/refresh-tokens', async ({ request }) => {
        const body = (await request.json()) as { refreshToken: string };
        const { refreshToken } = body;

        if (!refreshToken) {
            return HttpResponse.json({ message: 'Refresh token required' }, { status: 400 });
        }

        return HttpResponse.json(mockAuthResponse);
    }),

    http.post('/api/v1/auth/logout', async () => {
        return HttpResponse.json({ message: 'Logged out successfully' });
    })
);

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_USE_MOCK_DATA', 'false');
    });

    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const result = await authService.login(mockValidLoginRequest);

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).toHaveBeenCalledWith(mockAuthResponse);
        });

        it('should fail login with invalid credentials', async () => {
            await expect(authService.login(mockInvalidLoginRequest)).rejects.toThrow();
        });

        it('should use mock data when VITE_USE_MOCK_DATA is true', async () => {
            vi.stubEnv('VITE_USE_MOCK_DATA', 'true');

            const result = await authService.login(mockValidLoginRequest);

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).not.toHaveBeenCalled();
        });

        it('should handle 401 unauthorized error', async () => {
            await expect(authService.login(mockInvalidLoginRequest)).rejects.toHaveProperty('response.status', 401);
        });

        it('should fallback to mock data on 504 gateway timeout error', async () => {
            server.use(
                http.post('/api/v1/auth/login', () => {
                    return HttpResponse.json({ message: 'Gateway Timeout' }, { status: 504 });
                })
            );

            const result = await authService.login(mockValidLoginRequest);

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).toHaveBeenCalledWith(mockAuthResponse);
        });

        it('should fallback to mock data on network error', async () => {
            server.use(
                http.post('/api/v1/auth/login', () => {
                    return HttpResponse.error();
                })
            );

            const result = await authService.login(mockValidLoginRequest);

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).toHaveBeenCalledWith(mockAuthResponse);
        });
    });

    describe('register', () => {
        it('should register successfully with valid data', async () => {
            const result = await authService.register(mockSignupRequest);

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).toHaveBeenCalledWith(mockAuthResponse);
        });

        it('should use mock data when VITE_USE_MOCK_DATA is true', async () => {
            vi.stubEnv('VITE_USE_MOCK_DATA', 'true');

            const result = await authService.register(mockSignupRequest);

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).not.toHaveBeenCalled();
        });

        it('should fallback to mock data on server error', async () => {
            server.use(
                http.post('/api/v1/auth/register', () => {
                    return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
                })
            );

            const result = await authService.register(mockSignupRequest);

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).toHaveBeenCalledWith(mockAuthResponse);
        });
    });

    describe('refreshToken', () => {
        it('should refresh token successfully', async () => {
            const result = await authService.refreshToken();

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).toHaveBeenCalledWith(mockAuthResponse);
        });

        it('should use mock data when VITE_USE_MOCK_DATA is true', async () => {
            vi.stubEnv('VITE_USE_MOCK_DATA', 'true');

            const result = await authService.refreshToken();

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).not.toHaveBeenCalled();
        });

        it('should fallback to mock data on server error', async () => {
            server.use(
                http.post('/api/v1/auth/refresh', () => {
                    return HttpResponse.json({ message: 'Bad Gateway' }, { status: 502 });
                })
            );

            const result = await authService.refreshToken();

            expect(result).toEqual(mockAuthResponse);
            expect(mockApiHelpers.setAuthData).toHaveBeenCalledWith(mockAuthResponse);
        });
    });

    describe('logout', () => {
        it('should logout successfully', async () => {
            mockApiHelpers.getStoredRefreshToken.mockReturnValue('mock-refresh-token');

            await expect(authService.logout()).resolves.toBeUndefined();
        });

        it('should clear auth data when no refresh token found', async () => {
            mockApiHelpers.getStoredRefreshToken.mockReturnValue(null);

            await expect(authService.logout()).resolves.toBeUndefined();
            expect(mockApiHelpers.clearAuthData).toHaveBeenCalled();
        });

        it('should use mock data when VITE_USE_MOCK_DATA is true', async () => {
            vi.stubEnv('VITE_USE_MOCK_DATA', 'true');

            await expect(authService.logout()).resolves.toBeUndefined();
            expect(mockApiHelpers.clearAuthData).toHaveBeenCalled();
        });

        it('should fallback to clearing local data on server error', async () => {
            mockApiHelpers.getStoredRefreshToken.mockReturnValue('mock-refresh-token');
            server.use(
                http.post('/api/v1/auth/logout', () => {
                    return HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 });
                })
            );

            await expect(authService.logout()).resolves.toBeUndefined();
            expect(mockApiHelpers.clearAuthData).toHaveBeenCalled();
        });
    });

    describe('mock data delay', () => {
        it('should apply mock delay when using mock data', async () => {
            vi.stubEnv('VITE_USE_MOCK_DATA', 'true');

            const startTime = Date.now();
            await authService.login(mockValidLoginRequest);
            const endTime = Date.now();

            // Should take at least some time due to mockApiDelay
            expect(endTime - startTime).toBeGreaterThan(0);
        });
    });
});
