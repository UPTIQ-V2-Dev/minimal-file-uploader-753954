import { fileService } from '../services/index.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import { AuthenticatedRequest } from '../utils/types.ts';
import { Response } from 'express';
import httpStatus from 'http-status';

const uploadFile = catchAsyncWithAuth(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided');
    }

    const fileData = {
        originalname: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size
    };

    const userId = req.user.id;
    const file = await fileService.uploadFile(fileData, userId);

    // Transform response to match API specification
    const response = {
        id: file.id.toString(),
        filename: file.originalName,
        signedUrl: file.signedUrl,
        contentType: file.contentType,
        size: file.size,
        uploadedAt: file.uploadedAt.toISOString()
    };

    res.status(httpStatus.CREATED).send(response);
});

const getFile = catchAsyncWithAuth(async (req: AuthenticatedRequest, res: Response) => {
    const fileId = parseInt(req.params.id);
    const userId = req.user.id;

    const file = await fileService.getFileById(fileId, userId);
    if (!file) {
        throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
    }

    // Transform response to match API specification
    const response = {
        id: file.id.toString(),
        filename: file.originalName,
        signedUrl: file.signedUrl,
        contentType: file.contentType,
        size: file.size,
        uploadedAt: file.uploadedAt.toISOString()
    };

    res.send(response);
});

const getFiles = catchAsyncWithAuth(async (req: AuthenticatedRequest, res: Response) => {
    const options = pick(req.validatedQuery, ['limit', 'page', 'sortBy', 'sortType']);
    const userId = req.user.id;

    const files = await fileService.queryUserFiles(userId, options);

    // Transform response to match API specification format
    const response = files.map(file => ({
        id: file.id.toString(),
        filename: file.originalName,
        signedUrl: file.signedUrl,
        contentType: file.contentType,
        size: file.size,
        uploadedAt: file.uploadedAt.toISOString()
    }));

    res.send(response);
});

const updateFile = catchAsyncWithAuth(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided');
    }

    const fileId = parseInt(req.params.id);
    const userId = req.user.id;

    const fileData = {
        originalname: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size
    };

    const file = await fileService.updateFileById(fileId, userId, fileData);

    // Transform response to match API specification
    const response = {
        id: file.id.toString(),
        filename: file.originalName,
        signedUrl: file.signedUrl,
        contentType: file.contentType,
        size: file.size,
        uploadedAt: file.uploadedAt.toISOString()
    };

    res.send(response);
});

const deleteFile = catchAsyncWithAuth(async (req: AuthenticatedRequest, res: Response) => {
    const fileId = parseInt(req.params.id);
    const userId = req.user.id;

    await fileService.deleteFileById(fileId, userId);
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    uploadFile,
    getFile,
    getFiles,
    updateFile,
    deleteFile
};
