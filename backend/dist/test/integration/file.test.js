import prisma from "../../client.js";
import fileRoute from "../../routes/v1/file.route.js";
import { getInstance } from "../../storage/main.js";
import express from 'express';
import httpStatus from 'http-status';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
// Mock dependencies
vi.mock('../../client.ts');
vi.mock('../../storage/main.ts');
// Create a mockAuth function that can be controlled per test
const mockAuth = vi.fn(() => (req, res, next) => {
    req.user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
    };
    next();
});
vi.mock('../../middlewares/auth.ts', () => ({
    default: mockAuth
}));
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'mocked-uuid')
}));
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/files', fileRoute);
// Add error handling middleware to simulate production behavior
app.use((err, req, res) => {
    const statusCode = err.statusCode || err.status || 500;
    let message = err.message;
    // Handle multer errors specifically
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large' });
    }
    if (err.code === 'UNSUPPORTED_FILE_TYPE' || err.message === 'Unsupported file type') {
        return res.status(415).json({ message: 'Unsupported file type' });
    }
    res.status(statusCode).json({ message });
});
const mockStorage = {
    uploadData: vi.fn(),
    generateDownloadSignedUrl: vi.fn(),
    deleteFile: vi.fn()
};
const mockPrisma = {
    file: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }
};
// Removed unused testUser
describe('File API Integration Tests', () => {
    let authToken;
    beforeAll(() => {
        // Create mock auth token for tests
        authToken = 'mock-auth-token';
    });
    beforeEach(() => {
        vi.clearAllMocks();
        getInstance.mockReturnValue(mockStorage);
        prisma.file = mockPrisma.file;
        process.env.STORAGE_BUCKET_NAME = 'test-bucket';
        // Reset auth mock to default authenticated user behavior
        mockAuth.mockImplementation(() => (req, res, next) => {
            req.user = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER'
            };
            next();
        });
    });
    describe('POST /files/upload', () => {
        const mockFile = {
            id: 1,
            filename: 'mocked-uuid.pdf',
            originalName: 'test.pdf',
            contentType: 'application/pdf',
            size: 1024,
            signedUrl: 'https://example.com/signed-url',
            uploadedAt: new Date('2025-10-24T10:00:00Z'),
            updatedAt: new Date('2025-10-24T10:00:00Z'),
            userId: 1
        };
        it('should upload file successfully', async () => {
            mockStorage.uploadData.mockResolvedValue(undefined);
            mockStorage.generateDownloadSignedUrl.mockResolvedValue('https://example.com/signed-url');
            mockPrisma.file.create.mockResolvedValue(mockFile);
            const response = await request(app)
                .post('/files/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from('test file content'), 'test.pdf')
                .expect(httpStatus.CREATED);
            expect(response.body).toEqual({
                id: '1',
                filename: 'test.pdf',
                signedUrl: 'https://example.com/signed-url',
                contentType: 'application/pdf',
                size: expect.any(Number),
                uploadedAt: '2025-10-24T10:00:00.000Z'
            });
            expect(mockStorage.uploadData).toHaveBeenCalledWith({
                bucketName: 'test-bucket',
                data: expect.any(Buffer),
                destinationKey: 'files/1/mocked-uuid.pdf',
                contentType: 'application/pdf'
            });
        });
        it('should return 400 when no file provided', async () => {
            const response = await request(app)
                .post('/files/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(httpStatus.BAD_REQUEST);
            expect(response.body).toMatchObject({
                message: 'No file provided'
            });
        });
        it('should return 401 when not authenticated', async () => {
            // Override auth mock to fail authentication for this test
            mockAuth.mockImplementation(() => (req, res) => {
                return res.status(401).json({ message: 'Please authenticate' });
            });
            const response = await request(app)
                .post('/files/upload')
                .attach('file', Buffer.from('test content'), 'test.pdf')
                .expect(httpStatus.UNAUTHORIZED);
            expect(response.body).toMatchObject({
                message: 'Please authenticate'
            });
        });
        it('should return 415 for unsupported file type', async () => {
            const response = await request(app)
                .post('/files/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .field('test', 'data') // Add form data to trigger multer
                .attach('file', Buffer.from('test content'), {
                filename: 'test.exe',
                contentType: 'application/x-executable'
            })
                .expect(httpStatus.UNSUPPORTED_MEDIA_TYPE);
            expect(response.body).toMatchObject({
                message: 'Unsupported file type'
            });
        });
    });
    describe('GET /files/:id', () => {
        const mockFile = {
            id: 1,
            filename: 'test.pdf',
            originalName: 'test.pdf',
            contentType: 'application/pdf',
            size: 1024,
            signedUrl: 'https://example.com/signed-url',
            uploadedAt: new Date('2025-10-24T10:00:00Z'),
            updatedAt: new Date('2025-10-24T10:00:00Z'),
            userId: 1
        };
        it('should get file by id successfully', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(mockFile);
            mockStorage.generateDownloadSignedUrl.mockResolvedValue('https://example.com/new-signed-url');
            mockPrisma.file.update.mockResolvedValue({
                ...mockFile,
                signedUrl: 'https://example.com/new-signed-url'
            });
            const response = await request(app)
                .get('/files/1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(httpStatus.OK);
            expect(response.body).toEqual({
                id: '1',
                filename: 'test.pdf',
                signedUrl: 'https://example.com/new-signed-url',
                contentType: 'application/pdf',
                size: 1024,
                uploadedAt: '2025-10-24T10:00:00.000Z'
            });
            expect(mockPrisma.file.findFirst).toHaveBeenCalledWith({
                where: { id: 1, userId: 1 }
            });
        });
        it('should return 404 when file not found', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(null);
            const response = await request(app)
                .get('/files/999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(httpStatus.NOT_FOUND);
            expect(response.body).toMatchObject({
                message: 'File not found'
            });
        });
        it('should return 401 when not authenticated', async () => {
            // Override auth mock to fail authentication for this test
            mockAuth.mockImplementation(() => (req, res) => {
                return res.status(401).json({ message: 'Please authenticate' });
            });
            const response = await request(app).get('/files/1').expect(httpStatus.UNAUTHORIZED);
            expect(response.body).toMatchObject({
                message: 'Please authenticate'
            });
        });
    });
    describe('GET /files', () => {
        const mockFiles = [
            {
                id: 1,
                filename: 'test1.pdf',
                originalName: 'test1.pdf',
                contentType: 'application/pdf',
                size: 1024,
                signedUrl: 'https://example.com/url1',
                uploadedAt: new Date('2025-10-24T10:00:00Z'),
                updatedAt: new Date('2025-10-24T10:00:00Z'),
                userId: 1
            },
            {
                id: 2,
                filename: 'test2.pdf',
                originalName: 'test2.pdf',
                contentType: 'application/pdf',
                size: 2048,
                signedUrl: 'https://example.com/url2',
                uploadedAt: new Date('2025-10-24T11:00:00Z'),
                updatedAt: new Date('2025-10-24T11:00:00Z'),
                userId: 1
            }
        ];
        it('should get user files successfully', async () => {
            mockPrisma.file.findMany.mockResolvedValue(mockFiles);
            const response = await request(app)
                .get('/files')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(httpStatus.OK);
            expect(response.body).toEqual([
                {
                    id: '1',
                    filename: 'test1.pdf',
                    signedUrl: 'https://example.com/url1',
                    contentType: 'application/pdf',
                    size: 1024,
                    uploadedAt: '2025-10-24T10:00:00.000Z'
                },
                {
                    id: '2',
                    filename: 'test2.pdf',
                    signedUrl: 'https://example.com/url2',
                    contentType: 'application/pdf',
                    size: 2048,
                    uploadedAt: '2025-10-24T11:00:00.000Z'
                }
            ]);
            expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                skip: 0,
                take: 10,
                orderBy: { uploadedAt: 'desc' }
            });
        });
        it('should get user files with query parameters', async () => {
            mockPrisma.file.findMany.mockResolvedValue(mockFiles);
            await request(app)
                .get('/files?page=2&limit=5&sortBy=originalName&sortType=asc')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(httpStatus.OK);
            expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                skip: 5,
                take: 5,
                orderBy: { originalName: 'asc' }
            });
        });
        it('should return 401 when not authenticated', async () => {
            // Override auth mock to fail authentication for this test
            mockAuth.mockImplementation(() => (req, res) => {
                return res.status(401).json({ message: 'Please authenticate' });
            });
            const response = await request(app).get('/files').expect(httpStatus.UNAUTHORIZED);
            expect(response.body).toMatchObject({
                message: 'Please authenticate'
            });
        });
    });
    describe('PUT /files/:id', () => {
        const existingFile = {
            id: 1,
            filename: 'old-file.pdf',
            originalName: 'old-file.pdf',
            contentType: 'application/pdf',
            size: 1024,
            signedUrl: 'https://example.com/old-url',
            uploadedAt: new Date('2025-10-24T10:00:00Z'),
            updatedAt: new Date('2025-10-24T10:00:00Z'),
            userId: 1
        };
        const updatedFile = {
            ...existingFile,
            filename: 'mocked-uuid.pdf',
            originalName: 'updated-file.pdf',
            size: 2048,
            signedUrl: 'https://example.com/new-url'
        };
        it('should update file successfully', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(existingFile);
            mockStorage.deleteFile.mockResolvedValue(undefined);
            mockStorage.uploadData.mockResolvedValue(undefined);
            mockStorage.generateDownloadSignedUrl.mockResolvedValue('https://example.com/new-url');
            mockPrisma.file.update.mockResolvedValue(updatedFile);
            const response = await request(app)
                .put('/files/1')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from('updated content'), 'updated-file.pdf')
                .expect(httpStatus.OK);
            expect(response.body).toEqual({
                id: '1',
                filename: 'updated-file.pdf',
                signedUrl: 'https://example.com/new-url',
                contentType: 'application/pdf',
                size: 2048,
                uploadedAt: '2025-10-24T10:00:00.000Z'
            });
            expect(mockStorage.deleteFile).toHaveBeenCalledWith({
                bucketName: 'test-bucket',
                key: 'files/1/old-file.pdf'
            });
            expect(mockStorage.uploadData).toHaveBeenCalledWith({
                bucketName: 'test-bucket',
                data: expect.any(Buffer),
                destinationKey: 'files/1/mocked-uuid.pdf',
                contentType: 'application/pdf'
            });
        });
        it('should return 400 when no file provided', async () => {
            const response = await request(app)
                .put('/files/1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(httpStatus.BAD_REQUEST);
            expect(response.body).toMatchObject({
                message: 'No file provided'
            });
        });
        it('should return 404 when file not found', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(null);
            const response = await request(app)
                .put('/files/999')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from('content'), 'test.pdf')
                .expect(httpStatus.NOT_FOUND);
            expect(response.body).toMatchObject({
                message: 'File not found'
            });
        });
        it('should return 401 when not authenticated', async () => {
            // Override auth mock to fail authentication for this test
            mockAuth.mockImplementation(() => (req, res) => {
                return res.status(401).json({ message: 'Please authenticate' });
            });
            const response = await request(app)
                .put('/files/1')
                .attach('file', Buffer.from('content'), 'test.pdf')
                .expect(httpStatus.UNAUTHORIZED);
            expect(response.body).toMatchObject({
                message: 'Please authenticate'
            });
        });
    });
    describe('DELETE /files/:id', () => {
        const mockFile = {
            id: 1,
            filename: 'test.pdf',
            originalName: 'test.pdf',
            contentType: 'application/pdf',
            size: 1024,
            signedUrl: 'https://example.com/url',
            uploadedAt: new Date('2025-10-24T10:00:00Z'),
            updatedAt: new Date('2025-10-24T10:00:00Z'),
            userId: 1
        };
        it('should delete file successfully', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(mockFile);
            mockStorage.deleteFile.mockResolvedValue(undefined);
            mockPrisma.file.delete.mockResolvedValue(mockFile);
            await request(app)
                .delete('/files/1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(httpStatus.NO_CONTENT);
            expect(mockPrisma.file.findFirst).toHaveBeenCalledWith({
                where: { id: 1, userId: 1 }
            });
            expect(mockStorage.deleteFile).toHaveBeenCalledWith({
                bucketName: 'test-bucket',
                key: 'files/1/test.pdf'
            });
            expect(mockPrisma.file.delete).toHaveBeenCalledWith({
                where: { id: 1 }
            });
        });
        it('should return 404 when file not found', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(null);
            const response = await request(app)
                .delete('/files/999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(httpStatus.NOT_FOUND);
            expect(response.body).toMatchObject({
                message: 'File not found'
            });
        });
        it('should return 401 when not authenticated', async () => {
            // Override auth mock to fail authentication for this test
            mockAuth.mockImplementation(() => (req, res) => {
                return res.status(401).json({ message: 'Please authenticate' });
            });
            const response = await request(app).delete('/files/1').expect(httpStatus.UNAUTHORIZED);
            expect(response.body).toMatchObject({
                message: 'Please authenticate'
            });
        });
    });
});
