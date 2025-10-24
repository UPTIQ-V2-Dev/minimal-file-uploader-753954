import prisma from '../../client.ts';
import fileService from '../../services/file.service.ts';
import { getInstance } from '../../storage/main.ts';
import ApiError from '../../utils/ApiError.ts';
import httpStatus from 'http-status';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('../../client.ts');
vi.mock('../../storage/main.ts');
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'mocked-uuid')
}));

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

describe('File Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getInstance as any).mockReturnValue(mockStorage);
        (prisma as any).file = mockPrisma.file;
        process.env.STORAGE_BUCKET_NAME = 'test-bucket';
    });

    describe('uploadFile', () => {
        const mockFileData = {
            originalname: 'test.pdf',
            buffer: Buffer.from('test file content'),
            mimetype: 'application/pdf',
            size: 1024
        };

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

            const result = await fileService.uploadFile(mockFileData, 1);

            expect(mockStorage.uploadData).toHaveBeenCalledWith({
                bucketName: 'test-bucket',
                data: mockFileData.buffer,
                destinationKey: 'files/1/mocked-uuid.pdf',
                contentType: 'application/pdf'
            });
            expect(mockStorage.generateDownloadSignedUrl).toHaveBeenCalledWith({
                bucketName: 'test-bucket',
                key: 'files/1/mocked-uuid.pdf',
                fileName: 'test.pdf'
            });
            expect(mockPrisma.file.create).toHaveBeenCalledWith({
                data: {
                    filename: 'mocked-uuid.pdf',
                    originalName: 'test.pdf',
                    contentType: 'application/pdf',
                    size: 1024,
                    signedUrl: 'https://example.com/signed-url',
                    userId: 1
                }
            });
            expect(result).toEqual(mockFile);
        });

        it('should throw error for unsupported file type', async () => {
            const invalidFileData = {
                ...mockFileData,
                mimetype: 'application/exe'
            };

            await expect(fileService.uploadFile(invalidFileData, 1)).rejects.toThrow(
                new ApiError(httpStatus.UNSUPPORTED_MEDIA_TYPE, 'Unsupported file type')
            );
        });

        it('should throw error for file size exceeding limit', async () => {
            const largeFileData = {
                ...mockFileData,
                size: 11 * 1024 * 1024 // 11MB
            };

            await expect(fileService.uploadFile(largeFileData, 1)).rejects.toThrow(
                new ApiError(httpStatus.REQUEST_ENTITY_TOO_LARGE, 'File size exceeds 10MB limit')
            );
        });

        it('should handle storage upload failure', async () => {
            mockStorage.uploadData.mockRejectedValue(new Error('Storage error'));

            await expect(fileService.uploadFile(mockFileData, 1)).rejects.toThrow(
                new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload file')
            );
        });
    });

    describe('getFileById', () => {
        const mockFile = {
            id: 1,
            filename: 'test.pdf',
            originalName: 'test.pdf',
            contentType: 'application/pdf',
            size: 1024,
            signedUrl: 'https://example.com/old-url',
            uploadedAt: new Date('2025-10-24T10:00:00Z'),
            updatedAt: new Date('2025-10-24T10:00:00Z'),
            userId: 1
        };

        it('should get file by id and generate fresh signed URL', async () => {
            const updatedFile = { ...mockFile, signedUrl: 'https://example.com/new-signed-url' };

            mockPrisma.file.findFirst.mockResolvedValue(mockFile);
            mockStorage.generateDownloadSignedUrl.mockResolvedValue('https://example.com/new-signed-url');
            mockPrisma.file.update.mockResolvedValue(updatedFile);

            const result = await fileService.getFileById(1, 1);

            expect(mockPrisma.file.findFirst).toHaveBeenCalledWith({
                where: { id: 1, userId: 1 }
            });
            expect(mockStorage.generateDownloadSignedUrl).toHaveBeenCalledWith({
                bucketName: 'test-bucket',
                key: 'files/1/test.pdf',
                fileName: 'test.pdf'
            });
            expect(mockPrisma.file.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { signedUrl: 'https://example.com/new-signed-url' }
            });
            expect(result).toEqual(updatedFile);
        });

        it('should return null if file not found', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(null);

            const result = await fileService.getFileById(1, 1);

            expect(result).toBeNull();
        });

        it('should return file with old URL if signed URL generation fails', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(mockFile);
            mockStorage.generateDownloadSignedUrl.mockRejectedValue(new Error('URL generation failed'));

            const result = await fileService.getFileById(1, 1);

            expect(result).toEqual(mockFile);
        });
    });

    describe('queryUserFiles', () => {
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

        it('should query user files with default options', async () => {
            mockPrisma.file.findMany.mockResolvedValue(mockFiles);

            const result = await fileService.queryUserFiles(1, {});

            expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                skip: 0,
                take: 10,
                orderBy: { uploadedAt: 'desc' }
            });
            expect(result).toEqual(mockFiles);
        });

        it('should query user files with custom options', async () => {
            mockPrisma.file.findMany.mockResolvedValue(mockFiles);

            const result = await fileService.queryUserFiles(1, {
                page: 2,
                limit: 5,
                sortBy: 'originalName',
                sortType: 'asc'
            });

            expect(mockPrisma.file.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                skip: 5,
                take: 5,
                orderBy: { originalName: 'asc' }
            });
            expect(result).toEqual(mockFiles);
        });
    });

    describe('updateFileById', () => {
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

        const newFileData = {
            originalname: 'new-file.pdf',
            buffer: Buffer.from('new file content'),
            mimetype: 'application/pdf',
            size: 2048
        };

        const updatedFile = {
            ...existingFile,
            filename: 'mocked-uuid.pdf',
            originalName: 'new-file.pdf',
            size: 2048,
            signedUrl: 'https://example.com/new-url'
        };

        it('should update file successfully', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(existingFile);
            mockStorage.deleteFile.mockResolvedValue(undefined);
            mockStorage.uploadData.mockResolvedValue(undefined);
            mockStorage.generateDownloadSignedUrl.mockResolvedValue('https://example.com/new-url');
            mockPrisma.file.update.mockResolvedValue(updatedFile);

            const result = await fileService.updateFileById(1, 1, newFileData);

            expect(mockPrisma.file.findFirst).toHaveBeenCalledWith({
                where: { id: 1, userId: 1 }
            });
            expect(mockStorage.deleteFile).toHaveBeenCalledWith({
                bucketName: 'test-bucket',
                key: 'files/1/old-file.pdf'
            });
            expect(mockStorage.uploadData).toHaveBeenCalledWith({
                bucketName: 'test-bucket',
                data: newFileData.buffer,
                destinationKey: 'files/1/mocked-uuid.pdf',
                contentType: 'application/pdf'
            });
            expect(result).toEqual(updatedFile);
        });

        it('should throw error if file not found', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(null);

            await expect(fileService.updateFileById(1, 1, newFileData)).rejects.toThrow(
                new ApiError(httpStatus.NOT_FOUND, 'File not found')
            );
        });

        it('should throw error for unsupported file type', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(existingFile);

            const invalidFileData = {
                ...newFileData,
                mimetype: 'application/exe'
            };

            await expect(fileService.updateFileById(1, 1, invalidFileData)).rejects.toThrow(
                new ApiError(httpStatus.UNSUPPORTED_MEDIA_TYPE, 'Unsupported file type')
            );
        });
    });

    describe('deleteFileById', () => {
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

            const result = await fileService.deleteFileById(1, 1);

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
            expect(result).toEqual(mockFile);
        });

        it('should throw error if file not found', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(null);

            await expect(fileService.deleteFileById(1, 1)).rejects.toThrow(
                new ApiError(httpStatus.NOT_FOUND, 'File not found')
            );
        });

        it('should handle storage deletion failure', async () => {
            mockPrisma.file.findFirst.mockResolvedValue(mockFile);
            mockStorage.deleteFile.mockRejectedValue(new Error('Storage error'));

            await expect(fileService.deleteFileById(1, 1)).rejects.toThrow(
                new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete file')
            );
        });
    });
});
