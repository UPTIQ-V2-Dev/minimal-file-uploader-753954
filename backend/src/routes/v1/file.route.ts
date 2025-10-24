import { fileController } from '../../controllers/index.ts';
import auth from '../../middlewares/auth.ts';
import validate from '../../middlewares/validate.ts';
import { fileValidation } from '../../validations/index.ts';
import ApiError from '../../utils/ApiError.ts';
import { NextFunction, Request, Response } from 'express';
import express from 'express';
import httpStatus from 'http-status';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only one file at a time
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
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

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            const error = new Error('Unsupported file type') as any;
            error.code = 'UNSUPPORTED_FILE_TYPE';
            cb(error);
        }
    }
});

// Multer error handling middleware
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(httpStatus.REQUEST_ENTITY_TOO_LARGE, 'File size exceeds 10MB limit'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'Unexpected field name'));
        }
        return next(new ApiError(httpStatus.BAD_REQUEST, err.message));
    }
    if (err.code === 'UNSUPPORTED_FILE_TYPE') {
        return next(new ApiError(httpStatus.UNSUPPORTED_MEDIA_TYPE, 'Unsupported file type'));
    }
    next(err);
};

// File upload endpoint
router.post(
    '/upload',
    auth('manageFiles'),
    upload.single('file'),
    handleMulterError,
    validate(fileValidation.uploadFile),
    fileController.uploadFile
);

// Get user files
router.get('/', auth('getFiles'), validate(fileValidation.getFiles), fileController.getFiles);

// Get single file by ID
router.get('/:id', auth('getFiles'), validate(fileValidation.getFile), fileController.getFile);

// Update/replace file
router.put(
    '/:id',
    auth('manageFiles'),
    upload.single('file'),
    handleMulterError,
    validate(fileValidation.updateFile),
    fileController.updateFile
);

// Delete file
router.delete('/:id', auth('manageFiles'), validate(fileValidation.deleteFile), fileController.deleteFile);

export default router;

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload and management
 */

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Upload a file
 *     description: Upload a file to cloud storage. Supports PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF up to 10MB.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 10MB)
 *             required:
 *               - file
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: File ID
 *                 filename:
 *                   type: string
 *                   description: Original filename
 *                 signedUrl:
 *                   type: string
 *                   description: Signed URL for file access
 *                 contentType:
 *                   type: string
 *                   description: MIME type
 *                 size:
 *                   type: integer
 *                   description: File size in bytes
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Upload timestamp
 *               example:
 *                 id: "123"
 *                 filename: "document.pdf"
 *                 signedUrl: "https://storage.example.com/signed-url-123"
 *                 contentType: "application/pdf"
 *                 size: 1024000
 *                 uploadedAt: "2025-10-24T10:45:45Z"
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "413":
 *         description: File too large
 *       "415":
 *         description: Unsupported file type
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Get user's files
 *     description: Get paginated list of files uploaded by the authenticated user.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of files per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [uploadedAt, originalName, size, contentType]
 *           default: uploadedAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: File ID
 *                   filename:
 *                     type: string
 *                     description: Original filename
 *                   signedUrl:
 *                     type: string
 *                     description: Signed URL for file access
 *                   contentType:
 *                     type: string
 *                     description: MIME type
 *                   size:
 *                     type: integer
 *                     description: File size in bytes
 *                   uploadedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Upload timestamp
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Get file by ID
 *     description: Get file metadata and fresh signed URL by file ID.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: File ID
 *                 filename:
 *                   type: string
 *                   description: Original filename
 *                 signedUrl:
 *                   type: string
 *                   description: Signed URL for file access
 *                 contentType:
 *                   type: string
 *                   description: MIME type
 *                 size:
 *                   type: integer
 *                   description: File size in bytes
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Upload timestamp
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 *
 *   put:
 *     summary: Update/replace file
 *     description: Update/replace an existing file with a new file.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New file to replace the existing one (max 10MB)
 *             required:
 *               - file
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: File ID
 *                 filename:
 *                   type: string
 *                   description: Original filename
 *                 signedUrl:
 *                   type: string
 *                   description: Signed URL for file access
 *                 contentType:
 *                   type: string
 *                   description: MIME type
 *                 size:
 *                   type: integer
 *                   description: File size in bytes
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Upload timestamp
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "413":
 *         description: File too large
 *       "415":
 *         description: Unsupported file type
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 *
 *   delete:
 *     summary: Delete file
 *     description: Delete a file from storage and database.
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       "204":
 *         description: No Content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */
