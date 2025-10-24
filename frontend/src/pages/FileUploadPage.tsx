import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileDropzone } from '../components/upload/FileDropzone';
import { UploadProgress } from '../components/upload/UploadProgress';
import { UploadResult } from '../components/upload/UploadResult';
import { useFileUpload } from '../hooks/useFileUpload';
import { Button } from '../components/ui/button';

export const FileUploadPage = () => {
    const { uploadState, selectFile, startUpload, retry, reset, cancel, isUploading } = useFileUpload();

    // Auto-upload when file is selected
    useEffect(() => {
        if (uploadState.file && uploadState.status === 'idle') {
            startUpload();
        }
    }, [uploadState.file, uploadState.status, startUpload]);

    const handleUploadAnother = () => {
        reset();
    };

    return (
        <div className='min-h-screen bg-background'>
            <div className='container mx-auto px-4 py-8 max-w-2xl'>
                <div className='space-y-6'>
                    <div className='text-center space-y-2'>
                        <h1 className='text-3xl font-bold text-foreground'>File Upload</h1>
                        <p className='text-muted-foreground'>Upload your images or PDF files to cloud storage</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className='text-xl'>Upload File</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            {/* Show dropzone when idle or no file selected */}
                            {uploadState.status === 'idle' && !uploadState.file && (
                                <FileDropzone
                                    onFileSelect={selectFile}
                                    disabled={isUploading}
                                />
                            )}

                            {/* Show selected file info with upload button */}
                            {uploadState.file && uploadState.status === 'idle' && (
                                <div className='space-y-4'>
                                    <div className='p-4 bg-muted/30 rounded-lg'>
                                        <p className='text-sm font-medium'>Selected file:</p>
                                        <p className='text-sm text-muted-foreground'>{uploadState.file.name}</p>
                                    </div>
                                    <div className='flex gap-2'>
                                        <Button
                                            onClick={startUpload}
                                            className='flex-1'
                                        >
                                            Upload File
                                        </Button>
                                        <Button
                                            onClick={reset}
                                            variant='outline'
                                        >
                                            Change File
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Show upload progress */}
                            {uploadState.status === 'uploading' && uploadState.file && (
                                <UploadProgress
                                    progress={uploadState.progress}
                                    filename={uploadState.file.name}
                                    onCancel={cancel}
                                />
                            )}

                            {/* Show upload result (success or error) */}
                            {(uploadState.status === 'success' || uploadState.status === 'error') && (
                                <UploadResult
                                    result={uploadState.result || undefined}
                                    error={uploadState.error || undefined}
                                    onRetry={uploadState.status === 'error' ? retry : undefined}
                                    onUploadAnother={handleUploadAnother}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
