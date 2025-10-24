import { http, HttpResponse } from 'msw';
import { FileUploadResponse } from '../types/file';
import { mockAuthResponse, mockValidLoginRequest } from './authMocks';

export const handlers = [
    // Auth endpoints
    http.post('/api/v1/auth/login', async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        const { email, password } = body;

        // Simulate invalid credentials
        if (email !== mockValidLoginRequest.email || password !== mockValidLoginRequest.password) {
            return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }

        // Simulate successful login
        return HttpResponse.json(mockAuthResponse);
    }),

    http.post('/api/v1/auth/register', async () => {
        // Simulate registration success
        return HttpResponse.json(mockAuthResponse);
    }),

    http.post('/api/v1/auth/refresh-tokens', async ({ request }) => {
        const body = (await request.json()) as { refreshToken: string };
        const { refreshToken } = body;

        if (!refreshToken) {
            return HttpResponse.json({ message: 'Refresh token required' }, { status: 400 });
        }

        // Simulate token refresh success
        return HttpResponse.json(mockAuthResponse);
    }),

    http.post('/api/v1/auth/logout', async ({ request }) => {
        // Simulate logout success
        return HttpResponse.json({ message: 'Logged out successfully' });
    }),

    // File endpoints
    http.post('/api/v1/files/upload', async ({ request }) => {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return HttpResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Simulate upload success
        const response: FileUploadResponse = {
            id: 'mock-file-id-123',
            filename: file.name,
            signedUrl: 'https://mock-cloud-storage.example.com/signed-url-12345',
            contentType: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
        };

        return HttpResponse.json(response);
    }),

    http.get('/api/v1/files/:id', ({ params }) => {
        const { id } = params;

        const response: FileUploadResponse = {
            id: id as string,
            filename: 'test-file.jpg',
            signedUrl: 'https://mock-cloud-storage.example.com/signed-url-12345',
            contentType: 'image/jpeg',
            size: 1024000,
            uploadedAt: new Date().toISOString()
        };

        return HttpResponse.json(response);
    }),

    http.put('/api/v1/files/:id', async ({ params, request }) => {
        const { id } = params;
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return HttpResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const response: FileUploadResponse = {
            id: id as string,
            filename: file.name,
            signedUrl: 'https://mock-cloud-storage.example.com/signed-url-updated',
            contentType: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
        };

        return HttpResponse.json(response);
    })
];
