import prisma from "../client.js";
import { getInstance } from "../storage/main.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from 'http-status';
import path from 'path';
import { v4 as uuid } from 'uuid';
/**
 * Upload file to cloud storage and create database record
 * @param {Object} fileData - File upload data
 * @param {number} userId - User ID
 * @returns {Promise<File>}
 */
const uploadFile = async (fileData, userId) => {
    // Validate file type
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif'
    ];
    if (!allowedTypes.includes(fileData.mimetype)) {
        throw new ApiError(httpStatus.UNSUPPORTED_MEDIA_TYPE, 'Unsupported file type');
    }
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileData.size > maxSize) {
        throw new ApiError(httpStatus.REQUEST_ENTITY_TOO_LARGE, 'File size exceeds 10MB limit');
    }
    const storage = getInstance();
    const bucketName = process.env.STORAGE_BUCKET_NAME || 'default-bucket';
    // Generate unique filename
    const fileExtension = path.extname(fileData.originalname);
    const filename = `${uuid()}${fileExtension}`;
    const key = `files/${userId}/${filename}`;
    try {
        // Upload file to cloud storage
        await storage.uploadData({
            bucketName,
            data: fileData.buffer,
            destinationKey: key,
            contentType: fileData.mimetype
        });
        // Generate signed URL for access
        const signedUrl = await storage.generateDownloadSignedUrl({
            bucketName,
            key,
            fileName: fileData.originalname
        });
        // Create database record
        const file = await prisma.file.create({
            data: {
                filename,
                originalName: fileData.originalname,
                contentType: fileData.mimetype,
                size: fileData.size,
                signedUrl,
                userId
            }
        });
        return file;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload file');
    }
};
/**
 * Get file by id
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<File | null>}
 */
const getFileById = async (id, userId) => {
    const file = await prisma.file.findFirst({
        where: {
            id,
            userId // Ensure user can only access their own files
        }
    });
    if (!file) {
        return null;
    }
    // Generate fresh signed URL if needed
    try {
        const storage = getInstance();
        const bucketName = process.env.STORAGE_BUCKET_NAME || 'default-bucket';
        const key = `files/${userId}/${file.filename}`;
        const signedUrl = await storage.generateDownloadSignedUrl({
            bucketName,
            key,
            fileName: file.originalName
        });
        // Update signed URL in database
        const updatedFile = await prisma.file.update({
            where: { id },
            data: { signedUrl }
        });
        return updatedFile;
    }
    catch (error) {
        return file; // Return file with existing signed URL if generation fails
    }
};
/**
 * Query files for a user
 * @param {number} userId
 * @param {Object} options - Query options
 * @returns {Promise<File[]>}
 */
const queryUserFiles = async (userId, options) => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy || 'uploadedAt';
    const sortType = options.sortType ?? 'desc';
    const files = await prisma.file.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType }
    });
    return files;
};
/**
 * Update/replace existing file
 * @param {number} id
 * @param {number} userId
 * @param {Object} fileData - New file data
 * @returns {Promise<File>}
 */
const updateFileById = async (id, userId, fileData) => {
    // Check if file exists and belongs to user
    const existingFile = await prisma.file.findFirst({
        where: { id, userId }
    });
    if (!existingFile) {
        throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
    }
    // Validate file type
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif'
    ];
    if (!allowedTypes.includes(fileData.mimetype)) {
        throw new ApiError(httpStatus.UNSUPPORTED_MEDIA_TYPE, 'Unsupported file type');
    }
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileData.size > maxSize) {
        throw new ApiError(httpStatus.REQUEST_ENTITY_TOO_LARGE, 'File size exceeds 10MB limit');
    }
    const storage = getInstance();
    const bucketName = process.env.STORAGE_BUCKET_NAME || 'default-bucket';
    try {
        // Delete old file from storage
        const oldKey = `files/${userId}/${existingFile.filename}`;
        await storage.deleteFile({
            bucketName,
            key: oldKey
        });
        // Generate new filename
        const fileExtension = path.extname(fileData.originalname);
        const filename = `${uuid()}${fileExtension}`;
        const key = `files/${userId}/${filename}`;
        // Upload new file to cloud storage
        await storage.uploadData({
            bucketName,
            data: fileData.buffer,
            destinationKey: key,
            contentType: fileData.mimetype
        });
        // Generate signed URL for access
        const signedUrl = await storage.generateDownloadSignedUrl({
            bucketName,
            key,
            fileName: fileData.originalname
        });
        // Update database record
        const updatedFile = await prisma.file.update({
            where: { id },
            data: {
                filename,
                originalName: fileData.originalname,
                contentType: fileData.mimetype,
                size: fileData.size,
                signedUrl
            }
        });
        return updatedFile;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update file');
    }
};
/**
 * Delete file by id
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<File>}
 */
const deleteFileById = async (id, userId) => {
    const file = await prisma.file.findFirst({
        where: { id, userId }
    });
    if (!file) {
        throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
    }
    try {
        // Delete file from cloud storage
        const storage = getInstance();
        const bucketName = process.env.STORAGE_BUCKET_NAME || 'default-bucket';
        const key = `files/${userId}/${file.filename}`;
        await storage.deleteFile({
            bucketName,
            key
        });
        // Delete database record
        await prisma.file.delete({ where: { id } });
        return file;
    }
    catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete file');
    }
};
export default {
    uploadFile,
    getFileById,
    queryUserFiles,
    updateFileById,
    deleteFileById
};
