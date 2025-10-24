import { describe, it, expect } from 'vitest';
import { validateFile, formatFileSize, isImageFile, isPdfFile } from '../../utils/fileValidation';
import { createMockFile } from '../../__mocks__/fileMocks';

describe('fileValidation', () => {
    describe('validateFile', () => {
        it('should return null for valid image files', () => {
            const file = createMockFile('test.jpg', 'image/jpeg', 1024000);
            const result = validateFile(file);
            expect(result).toBeNull();
        });

        it('should return null for valid PDF files', () => {
            const file = createMockFile('test.pdf', 'application/pdf', 2048000);
            const result = validateFile(file);
            expect(result).toBeNull();
        });

        it('should return error for null file', () => {
            const result = validateFile(null);
            expect(result).toEqual({
                type: 'NO_FILE_SELECTED',
                message: 'Please select a file to upload'
            });
        });

        it('should return error for oversized file', () => {
            const file = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024); // 6MB
            const result = validateFile(file);
            expect(result).toEqual({
                type: 'FILE_TOO_LARGE',
                message: 'File size must be less than 5MB'
            });
        });

        it('should return error for invalid file type', () => {
            const file = createMockFile('test.txt', 'text/plain', 1024);
            const result = validateFile(file);
            expect(result).toEqual({
                type: 'INVALID_FILE_TYPE',
                message: 'Only JPG, PNG, GIF, and PDF files are allowed'
            });
        });

        it('should accept all valid image types', () => {
            const jpgFile = createMockFile('test.jpg', 'image/jpeg', 1024);
            const jpegFile = createMockFile('test.jpeg', 'image/jpeg', 1024);
            const pngFile = createMockFile('test.png', 'image/png', 1024);
            const gifFile = createMockFile('test.gif', 'image/gif', 1024);

            expect(validateFile(jpgFile)).toBeNull();
            expect(validateFile(jpegFile)).toBeNull();
            expect(validateFile(pngFile)).toBeNull();
            expect(validateFile(gifFile)).toBeNull();
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0 Bytes');
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1024 * 1024)).toBe('1 MB');
            expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
        });

        it('should format decimal values correctly', () => {
            expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 KB
            expect(formatFileSize(2097152)).toBe('2 MB'); // 2 MB
        });
    });

    describe('isImageFile', () => {
        it('should return true for image files', () => {
            const imageFile = createMockFile('test.jpg', 'image/jpeg', 1024);
            expect(isImageFile(imageFile)).toBe(true);
        });

        it('should return false for non-image files', () => {
            const pdfFile = createMockFile('test.pdf', 'application/pdf', 1024);
            expect(isImageFile(pdfFile)).toBe(false);
        });
    });

    describe('isPdfFile', () => {
        it('should return true for PDF files', () => {
            const pdfFile = createMockFile('test.pdf', 'application/pdf', 1024);
            expect(isPdfFile(pdfFile)).toBe(true);
        });

        it('should return false for non-PDF files', () => {
            const imageFile = createMockFile('test.jpg', 'image/jpeg', 1024);
            expect(isPdfFile(imageFile)).toBe(false);
        });
    });
});
