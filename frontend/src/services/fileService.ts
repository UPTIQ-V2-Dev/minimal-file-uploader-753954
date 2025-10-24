import { api } from '../lib/api';
import { FileUploadResponse } from '../types/file';
import { mockFileUploadResponse } from '../data/fileData';

export const uploadFile = async (file: File, onProgress?: (progress: number) => void): Promise<FileUploadResponse> => {
    // Return mock data if using mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        // Simulate upload progress
        if (onProgress) {
            for (let i = 0; i <= 100; i += 20) {
                setTimeout(() => onProgress(i), i * 10);
            }
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            ...mockFileUploadResponse,
            filename: file.name,
            contentType: file.type,
            size: file.size
        };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<FileUploadResponse>('/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progressEvent => {
            if (onProgress && progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(progress);
            }
        }
    });

    return response.data;
};

export const getFile = async (id: string): Promise<FileUploadResponse> => {
    // Return mock data if using mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        return { ...mockFileUploadResponse, id };
    }

    const response = await api.get<FileUploadResponse>(`/files/${id}`);
    return response.data;
};

export const updateFile = async (id: string, file: File): Promise<FileUploadResponse> => {
    // Return mock data if using mock mode
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        return {
            ...mockFileUploadResponse,
            id,
            filename: file.name,
            contentType: file.type,
            size: file.size
        };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.put<FileUploadResponse>(`/files/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    return response.data;
};
