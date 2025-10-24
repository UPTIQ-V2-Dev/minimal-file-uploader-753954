import { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { validateFile } from '../../utils/fileValidation';
import { FileValidationError } from '../../types/file';

interface FileDropzoneProps {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
    className?: string;
}

export const FileDropzone = ({ onFileSelect, disabled = false, className }: FileDropzoneProps) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<FileValidationError | null>(null);

    const handleFileSelection = useCallback(
        (file: File) => {
            const validationError = validateFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }
            setError(null);
            onFileSelect(file);
        },
        [onFileSelect]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            if (!disabled) {
                setIsDragOver(true);
            }
        },
        [disabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            if (disabled) return;

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileSelection(files[0]);
            }
        },
        [disabled, handleFileSelection]
    );

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileSelection(files[0]);
            }
        },
        [handleFileSelection]
    );

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <div className={cn('w-full', className)}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                    isDragOver && !disabled
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                    disabled && 'opacity-50 cursor-not-allowed',
                    !disabled && 'cursor-pointer hover:bg-muted/25'
                )}
            >
                <input
                    type='file'
                    accept='.jpg,.jpeg,.png,.gif,.pdf'
                    onChange={handleFileInputChange}
                    disabled={disabled}
                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed'
                    aria-label='Select file to upload'
                />

                <div className='flex flex-col items-center gap-4'>
                    <Upload
                        className={cn('h-12 w-12', disabled ? 'text-muted-foreground/50' : 'text-muted-foreground')}
                    />
                    <div className='space-y-2'>
                        <p
                            className={cn(
                                'text-sm font-medium',
                                disabled ? 'text-muted-foreground/50' : 'text-foreground'
                            )}
                        >
                            Drop your file here or click to browse
                        </p>
                        <p className={cn('text-xs', disabled ? 'text-muted-foreground/50' : 'text-muted-foreground')}>
                            Supports JPG, PNG, GIF, PDF • Max 5MB
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className='mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between'>
                    <p className='text-sm text-destructive'>{error.message}</p>
                    <button
                        onClick={clearError}
                        className='text-destructive hover:text-destructive/80 transition-colors'
                        aria-label='Clear error'
                    >
                        <X className='h-4 w-4' />
                    </button>
                </div>
            )}
        </div>
    );
};
