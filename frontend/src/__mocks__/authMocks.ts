import type { AuthResponse, LoginRequest, SignupRequest, User } from '@/types/user';

export const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    isEmailVerified: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
};

export const mockAuthResponse: AuthResponse = {
    user: mockUser,
    tokens: {
        access: {
            token: 'mock-access-token',
            expires: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        },
        refresh: {
            token: 'mock-refresh-token',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }
    }
};

export const mockValidLoginRequest: LoginRequest = {
    email: 'test@example.com',
    password: 'password123'
};

export const mockInvalidLoginRequest: LoginRequest = {
    email: 'wrong@example.com',
    password: 'wrongpassword'
};

export const mockSignupRequest: SignupRequest = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
};

export const createMockUser = (overrides?: Partial<User>): User => ({
    ...mockUser,
    ...overrides
});

export const createMockAuthResponse = (overrides?: Partial<AuthResponse>): AuthResponse => ({
    ...mockAuthResponse,
    ...overrides
});
