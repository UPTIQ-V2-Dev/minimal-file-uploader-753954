import { FileUploadResponse } from '../types/file';

export const mockFileUploadResponse: FileUploadResponse = {
    id: 'mock-file-id-123',
    filename: 'example-file.jpg',
    signedUrl: 'https://mock-cloud-storage.example.com/signed-url-12345',
    contentType: 'image/jpeg',
    size: 1024000,
    uploadedAt: new Date().toISOString()
};
