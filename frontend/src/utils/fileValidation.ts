import { FileValidationError } from '../types/file';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export const validateFile = (file: File | null): FileValidationError | null => {
    if (!file) {
        return {
            type: 'NO_FILE_SELECTED',
            message: 'Please select a file to upload'
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            type: 'FILE_TOO_LARGE',
            message: 'File size must be less than 5MB'
        };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return {
            type: 'INVALID_FILE_TYPE',
            message: 'Only JPG, PNG, GIF, and PDF files are allowed'
        };
    }

    return null;
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
};

export const isPdfFile = (file: File): boolean => {
    return file.type === 'application/pdf';
};
