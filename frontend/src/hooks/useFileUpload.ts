import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadFile } from '../services/fileService';
import { UploadState } from '../types/file';

export const useFileUpload = () => {
    const [uploadState, setUploadState] = useState<UploadState>({
        status: 'idle',
        progress: 0,
        file: null,
        result: null,
        error: null
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) =>
            uploadFile(file, progress => {
                setUploadState(prev => ({ ...prev, progress }));
            }),
        onMutate: (file: File) => {
            setUploadState(prev => ({
                ...prev,
                status: 'uploading',
                progress: 0,
                file,
                result: null,
                error: null
            }));
        },
        onSuccess: result => {
            setUploadState(prev => ({
                ...prev,
                status: 'success',
                progress: 100,
                result,
                error: null
            }));
        },
        onError: error => {
            setUploadState(prev => ({
                ...prev,
                status: 'error',
                progress: 0,
                result: null,
                error: error instanceof Error ? error.message : 'Upload failed'
            }));
        }
    });

    const selectFile = useCallback((file: File) => {
        setUploadState(prev => ({
            ...prev,
            file,
            status: 'idle',
            progress: 0,
            result: null,
            error: null
        }));
    }, []);

    const startUpload = useCallback(() => {
        if (uploadState.file) {
            uploadMutation.mutate(uploadState.file);
        }
    }, [uploadState.file, uploadMutation]);

    const retry = useCallback(() => {
        if (uploadState.file) {
            uploadMutation.mutate(uploadState.file);
        }
    }, [uploadState.file, uploadMutation]);

    const reset = useCallback(() => {
        setUploadState({
            status: 'idle',
            progress: 0,
            file: null,
            result: null,
            error: null
        });
        uploadMutation.reset();
    }, [uploadMutation]);

    const cancel = useCallback(() => {
        // Note: Actual cancellation would require AbortController support in the API
        setUploadState(prev => ({
            ...prev,
            status: 'idle',
            progress: 0
        }));
        uploadMutation.reset();
    }, [uploadMutation]);

    return {
        uploadState,
        selectFile,
        startUpload,
        retry,
        reset,
        cancel,
        isUploading: uploadState.status === 'uploading'
    };
};
