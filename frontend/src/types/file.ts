export interface FileUploadResponse {
    id: string;
    filename: string;
    signedUrl: string;
    contentType: string;
    size: number;
    uploadedAt: string;
}

export interface FileUploadRequest {
    file: File;
}

export interface FileValidationError {
    type: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'NO_FILE_SELECTED';
    message: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadState {
    status: UploadStatus;
    progress: number;
    file: File | null;
    result: FileUploadResponse | null;
    error: string | null;
}
