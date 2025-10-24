import { http, HttpResponse } from 'msw';
import { FileUploadResponse } from '../types/file';

export const handlers = [
    http.post('/api/files/upload', async ({ request }) => {
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

    http.get('/api/files/:id', ({ params }) => {
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

    http.put('/api/files/:id', async ({ params, request }) => {
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
