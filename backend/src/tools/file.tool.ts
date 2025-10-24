import { fileService } from '../services/index.ts';
import { MCPTool } from '../types/mcp.ts';
import pick from '../utils/pick.ts';
import { z } from 'zod';

const fileSchema = z.object({
    id: z.number(),
    filename: z.string(),
    originalName: z.string(),
    contentType: z.string(),
    size: z.number(),
    signedUrl: z.string().nullable(),
    uploadedAt: z.string(),
    updatedAt: z.string(),
    userId: z.number()
});

const uploadFileTool: MCPTool = {
    id: 'file_upload',
    name: 'Upload File',
    description: 'Upload a file to cloud storage for a user',
    inputSchema: z.object({
        userId: z.number().int(),
        originalname: z.string(),
        buffer: z.string().describe('Base64 encoded file content'),
        mimetype: z.string(),
        size: z.number().int()
    }),
    outputSchema: fileSchema,
    fn: async (inputs: { userId: number; originalname: string; buffer: string; mimetype: string; size: number }) => {
        // Convert base64 to buffer
        const buffer = Buffer.from(inputs.buffer, 'base64');

        const fileData = {
            originalname: inputs.originalname,
            buffer,
            mimetype: inputs.mimetype,
            size: inputs.size
        };

        const file = await fileService.uploadFile(fileData, inputs.userId);
        return {
            ...file,
            uploadedAt: file.uploadedAt.toISOString(),
            updatedAt: file.updatedAt.toISOString()
        };
    }
};

const getUserFilesTool: MCPTool = {
    id: 'file_get_user_files',
    name: 'Get User Files',
    description: 'Get all files uploaded by a specific user with optional pagination and sorting',
    inputSchema: z.object({
        userId: z.number().int(),
        limit: z.number().int().optional(),
        page: z.number().int().optional(),
        sortBy: z.string().optional(),
        sortType: z.enum(['asc', 'desc']).optional()
    }),
    outputSchema: z.object({
        files: z.array(fileSchema)
    }),
    fn: async (inputs: {
        userId: number;
        limit?: number;
        page?: number;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
    }) => {
        const options = pick(inputs, ['limit', 'page', 'sortBy', 'sortType']);
        const files = await fileService.queryUserFiles(inputs.userId, options);

        return {
            files: files.map(file => ({
                ...file,
                uploadedAt: file.uploadedAt.toISOString(),
                updatedAt: file.updatedAt.toISOString()
            }))
        };
    }
};

const getFileTool: MCPTool = {
    id: 'file_get_by_id',
    name: 'Get File By ID',
    description: 'Get a file by its ID, ensuring the user has access to it',
    inputSchema: z.object({
        id: z.number().int(),
        userId: z.number().int()
    }),
    outputSchema: z.union([fileSchema, z.null()]),
    fn: async (inputs: { id: number; userId: number }) => {
        const file = await fileService.getFileById(inputs.id, inputs.userId);
        if (!file) {
            return null;
        }
        return {
            ...file,
            uploadedAt: file.uploadedAt.toISOString(),
            updatedAt: file.updatedAt.toISOString()
        };
    }
};

const updateFileTool: MCPTool = {
    id: 'file_update',
    name: 'Update File',
    description: 'Update/replace an existing file with new content',
    inputSchema: z.object({
        id: z.number().int(),
        userId: z.number().int(),
        originalname: z.string(),
        buffer: z.string().describe('Base64 encoded file content'),
        mimetype: z.string(),
        size: z.number().int()
    }),
    outputSchema: fileSchema,
    fn: async (inputs: {
        id: number;
        userId: number;
        originalname: string;
        buffer: string;
        mimetype: string;
        size: number;
    }) => {
        // Convert base64 to buffer
        const buffer = Buffer.from(inputs.buffer, 'base64');

        const fileData = {
            originalname: inputs.originalname,
            buffer,
            mimetype: inputs.mimetype,
            size: inputs.size
        };

        const file = await fileService.updateFileById(inputs.id, inputs.userId, fileData);
        return {
            ...file,
            uploadedAt: file.uploadedAt.toISOString(),
            updatedAt: file.updatedAt.toISOString()
        };
    }
};

const deleteFileTool: MCPTool = {
    id: 'file_delete',
    name: 'Delete File',
    description: 'Delete a file by its ID',
    inputSchema: z.object({
        id: z.number().int(),
        userId: z.number().int()
    }),
    outputSchema: z.object({
        success: z.boolean(),
        deletedFile: fileSchema
    }),
    fn: async (inputs: { id: number; userId: number }) => {
        const deletedFile = await fileService.deleteFileById(inputs.id, inputs.userId);
        return {
            success: true,
            deletedFile: {
                ...deletedFile,
                uploadedAt: deletedFile.uploadedAt.toISOString(),
                updatedAt: deletedFile.updatedAt.toISOString()
            }
        };
    }
};

const getFileMetadataTool: MCPTool = {
    id: 'file_get_metadata',
    name: 'Get File Metadata',
    description: 'Get file metadata including storage information',
    inputSchema: z.object({
        id: z.number().int(),
        userId: z.number().int()
    }),
    outputSchema: z.object({
        id: z.number(),
        filename: z.string(),
        originalName: z.string(),
        contentType: z.string(),
        size: z.number(),
        uploadedAt: z.string(),
        storageInfo: z.object({
            bucket: z.string(),
            key: z.string(),
            provider: z.string()
        })
    }),
    fn: async (inputs: { id: number; userId: number }) => {
        const file = await fileService.getFileById(inputs.id, inputs.userId);
        if (!file) {
            throw new Error('File not found');
        }

        return {
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            contentType: file.contentType,
            size: file.size,
            uploadedAt: file.uploadedAt.toISOString(),
            storageInfo: {
                bucket: process.env.STORAGE_BUCKET_NAME || 'default-bucket',
                key: `files/${inputs.userId}/${file.filename}`,
                provider: process.env.INFRA_PROVIDER || 'unknown'
            }
        };
    }
};

export const fileTools: MCPTool[] = [
    uploadFileTool,
    getUserFilesTool,
    getFileTool,
    updateFileTool,
    deleteFileTool,
    getFileMetadataTool
];
