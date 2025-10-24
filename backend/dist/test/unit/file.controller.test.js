import fileController from "../../controllers/file.controller.js";
import { Role } from '../../generated/prisma/index.js';
import { fileService } from "../../services/index.js";
import ApiError from "../../utils/ApiError.js";
import httpStatus from 'http-status';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Mock dependencies
vi.mock('../../services/index.ts');
// Mock the catchAsyncWithAuth wrapper
vi.mock('../../utils/catchAsyncWithAuth.ts', () => ({
    default: (fn) => {
        return (req, res, next) => {
            try {
                const result = fn(req, res, next);
                if (result && typeof result.catch === 'function') {
                    return result.catch(next);
                }
                return result;
            }
            catch (error) {
                next(error);
            }
        };
    }
}));
const mockFileService = {
    uploadFile: vi.fn(),
    getFileById: vi.fn(),
    queryUserFiles: vi.fn(),
    updateFileById: vi.fn(),
    deleteFileById: vi.fn()
};
describe('File Controller', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        vi.clearAllMocks();
        fileService.uploadFile = mockFileService.uploadFile;
        fileService.getFileById = mockFileService.getFileById;
        fileService.queryUserFiles = mockFileService.queryUserFiles;
        fileService.updateFileById = mockFileService.updateFileById;
        fileService.deleteFileById = mockFileService.deleteFileById;
        mockReq = {
            user: {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                password: 'hashedPassword',
                role: Role.USER,
                isEmailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            validatedQuery: {},
            params: {},
            file: undefined
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        };
        mockNext = vi.fn();
    });
    describe('uploadFile', () => {
        const mockFile = {
            id: 1,
            filename: 'test-file.pdf',
            originalName: 'test.pdf',
            contentType: 'application/pdf',
            size: 1024,
            signedUrl: 'https://example.com/signed-url',
            uploadedAt: new Date('2025-10-24T10:00:00Z'),
            updatedAt: new Date('2025-10-24T10:00:00Z'),
            userId: 1
        };
        it('should upload file successfully', async () => {
            mockReq.file = {
                originalname: 'test.pdf',
                buffer: Buffer.from('file content'),
                mimetype: 'application/pdf',
                size: 1024
            };
            mockFileService.uploadFile.mockResolvedValue(mockFile);
            const controller = fileController.uploadFile;
            await controller(mockReq, mockRes, mockNext);
            expect(mockFileService.uploadFile).toHaveBeenCalledWith({
                originalname: 'test.pdf',
                buffer: mockReq.file.buffer,
                mimetype: 'application/pdf',
                size: 1024
            }, 1);
            expect(mockRes.status).toHaveBeenCalledWith(httpStatus.CREATED);
            expect(mockRes.send).toHaveBeenCalledWith({
                id: '1',
                filename: 'test.pdf',
                signedUrl: 'https://example.com/signed-url',
                contentType: 'application/pdf',
                size: 1024,
                uploadedAt: '2025-10-24T10:00:00.000Z'
            });
        });
        it('should call next with error when no file provided', async () => {
            mockReq.file = undefined;
            const controller = fileController.uploadFile;
            await controller(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
            const calledError = mockNext.mock.calls[0][0];
            expect(calledError.statusCode).toBe(httpStatus.BAD_REQUEST);
            expect(calledError.message).toBe('No file provided');
        });
    });
    describe('getFile', () => {
        const mockFile = {
            id: 1,
            filename: 'test-file.pdf',
            originalName: 'test.pdf',
            contentType: 'application/pdf',
            size: 1024,
            signedUrl: 'https://example.com/signed-url',
            uploadedAt: new Date('2025-10-24T10:00:00Z'),
            updatedAt: new Date('2025-10-24T10:00:00Z'),
            userId: 1
        };
        it('should get file successfully', async () => {
            mockReq.params = { id: '1' };
            mockFileService.getFileById.mockResolvedValue(mockFile);
            const controller = fileController.getFile;
            await controller(mockReq, mockRes, mockNext);
            expect(mockFileService.getFileById).toHaveBeenCalledWith(1, 1);
            expect(mockRes.send).toHaveBeenCalledWith({
                id: '1',
                filename: 'test.pdf',
                signedUrl: 'https://example.com/signed-url',
                contentType: 'application/pdf',
                size: 1024,
                uploadedAt: '2025-10-24T10:00:00.000Z'
            });
        });
        it('should call next with error when file not found', async () => {
            mockReq.params = { id: '1' };
            mockFileService.getFileById.mockResolvedValue(null);
            const controller = fileController.getFile;
            await controller(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
            const calledError = mockNext.mock.calls[0][0];
            expect(calledError.statusCode).toBe(httpStatus.NOT_FOUND);
            expect(calledError.message).toBe('File not found');
        });
    });
    describe('getFiles', () => {
        const mockFiles = [
            {
                id: 1,
                filename: 'test-file1.pdf',
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
                filename: 'test-file2.pdf',
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
            mockReq.validatedQuery = { limit: 10, page: 1, sortBy: 'uploadedAt', sortType: 'desc' };
            mockFileService.queryUserFiles.mockResolvedValue(mockFiles);
            const controller = fileController.getFiles;
            await controller(mockReq, mockRes, mockNext);
            expect(mockFileService.queryUserFiles).toHaveBeenCalledWith(1, {
                limit: 10,
                page: 1,
                sortBy: 'uploadedAt',
                sortType: 'desc'
            });
            expect(mockRes.send).toHaveBeenCalledWith([
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
        });
    });
    describe('updateFile', () => {
        const mockFile = {
            id: 1,
            filename: 'updated-file.pdf',
            originalName: 'updated.pdf',
            contentType: 'application/pdf',
            size: 2048,
            signedUrl: 'https://example.com/new-url',
            uploadedAt: new Date('2025-10-24T12:00:00Z'),
            updatedAt: new Date('2025-10-24T12:00:00Z'),
            userId: 1
        };
        it('should update file successfully', async () => {
            mockReq.params = { id: '1' };
            mockReq.file = {
                originalname: 'updated.pdf',
                buffer: Buffer.from('updated content'),
                mimetype: 'application/pdf',
                size: 2048
            };
            mockFileService.updateFileById.mockResolvedValue(mockFile);
            const controller = fileController.updateFile;
            await controller(mockReq, mockRes, mockNext);
            expect(mockFileService.updateFileById).toHaveBeenCalledWith(1, 1, {
                originalname: 'updated.pdf',
                buffer: mockReq.file.buffer,
                mimetype: 'application/pdf',
                size: 2048
            });
            expect(mockRes.send).toHaveBeenCalledWith({
                id: '1',
                filename: 'updated.pdf',
                signedUrl: 'https://example.com/new-url',
                contentType: 'application/pdf',
                size: 2048,
                uploadedAt: '2025-10-24T12:00:00.000Z'
            });
        });
        it('should call next with error when no file provided', async () => {
            mockReq.params = { id: '1' };
            mockReq.file = undefined;
            const controller = fileController.updateFile;
            await controller(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
            const calledError = mockNext.mock.calls[0][0];
            expect(calledError.statusCode).toBe(httpStatus.BAD_REQUEST);
            expect(calledError.message).toBe('No file provided');
        });
    });
    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            mockReq.params = { id: '1' };
            mockFileService.deleteFileById.mockResolvedValue({});
            const controller = fileController.deleteFile;
            await controller(mockReq, mockRes, mockNext);
            expect(mockFileService.deleteFileById).toHaveBeenCalledWith(1, 1);
            expect(mockRes.status).toHaveBeenCalledWith(httpStatus.NO_CONTENT);
            expect(mockRes.send).toHaveBeenCalled();
        });
    });
});
