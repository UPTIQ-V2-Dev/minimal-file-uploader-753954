import { useState } from 'react';
import { CheckCircle, XCircle, Copy, FileText, Image, RefreshCw, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { FileUploadResponse } from '../../types/file';
import { formatFileSize, isImageFile } from '../../utils/fileValidation';

interface UploadResultProps {
    result?: FileUploadResponse;
    error?: string;
    onRetry?: () => void;
    onUploadAnother?: () => void;
    className?: string;
}

export const UploadResult = ({ result, error, onRetry, onUploadAnother, className }: UploadResultProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopyUrl = async () => {
        if (result?.signedUrl) {
            try {
                await navigator.clipboard.writeText(result.signedUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy URL:', err);
            }
        }
    };

    if (error) {
        return (
            <Card className={cn('w-full p-6', className)}>
                <div className='flex items-start gap-4'>
                    <XCircle className='h-6 w-6 text-destructive flex-shrink-0 mt-0.5' />
                    <div className='flex-1 space-y-4'>
                        <div>
                            <h3 className='text-lg font-semibold text-destructive'>Upload Failed</h3>
                            <p className='text-sm text-muted-foreground mt-1'>{error}</p>
                        </div>
                        <div className='flex gap-2'>
                            {onRetry && (
                                <Button
                                    onClick={onRetry}
                                    size='sm'
                                    className='flex items-center gap-2'
                                >
                                    <RefreshCw className='h-4 w-4' />
                                    Try Again
                                </Button>
                            )}
                            {onUploadAnother && (
                                <Button
                                    onClick={onUploadAnother}
                                    variant='outline'
                                    size='sm'
                                >
                                    Upload Different File
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    if (!result) {
        return null;
    }

    const fileIcon = isImageFile({ type: result.contentType } as File) ? (
        <Image className='h-6 w-6 text-green-600' />
    ) : (
        <FileText className='h-6 w-6 text-green-600' />
    );

    return (
        <Card className={cn('w-full p-6', className)}>
            <div className='flex items-start gap-4'>
                <CheckCircle className='h-6 w-6 text-green-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1 space-y-4'>
                    <div>
                        <h3 className='text-lg font-semibold text-green-600'>Upload Successful!</h3>
                        <p className='text-sm text-muted-foreground mt-1'>
                            Your file has been uploaded to cloud storage.
                        </p>
                    </div>

                    <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
                        {fileIcon}
                        <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-foreground truncate'>{result.filename}</p>
                            <p className='text-xs text-muted-foreground'>
                                {formatFileSize(result.size)} • {new Date(result.uploadedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <label className='text-sm font-medium text-foreground'>Signed URL:</label>
                        <div className='flex items-center gap-2'>
                            <code className='flex-1 px-3 py-2 bg-muted rounded text-xs font-mono truncate'>
                                {result.signedUrl}
                            </code>
                            <Button
                                onClick={handleCopyUrl}
                                variant='outline'
                                size='sm'
                                className='flex items-center gap-1 flex-shrink-0'
                                disabled={copied}
                            >
                                {copied ? <Check className='h-3 w-3' /> : <Copy className='h-3 w-3' />}
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    </div>

                    {onUploadAnother && (
                        <div className='pt-2'>
                            <Button
                                onClick={onUploadAnother}
                                variant='outline'
                                size='sm'
                                className='w-full sm:w-auto'
                            >
                                Upload Another File
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
