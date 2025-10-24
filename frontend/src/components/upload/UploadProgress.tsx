import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UploadProgressProps {
    progress: number;
    filename: string;
    onCancel?: () => void;
    className?: string;
}

export const UploadProgress = ({ progress, filename, onCancel, className }: UploadProgressProps) => {
    return (
        <div className={cn('w-full p-4 bg-muted/30 rounded-lg border', className)}>
            <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin text-primary' />
                    <span className='text-sm font-medium text-foreground'>Uploading {filename}</span>
                </div>
                {onCancel && (
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={onCancel}
                        className='h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive'
                        aria-label='Cancel upload'
                    >
                        <X className='h-3 w-3' />
                    </Button>
                )}
            </div>

            <div className='space-y-2'>
                <Progress
                    value={progress}
                    className='w-full h-2'
                    aria-label={`Upload progress: ${progress}%`}
                />
                <div className='flex justify-between items-center'>
                    <span className='text-xs text-muted-foreground'>{progress}% complete</span>
                    <span className='text-xs text-muted-foreground'>
                        {progress === 100 ? 'Processing...' : 'Uploading...'}
                    </span>
                </div>
            </div>
        </div>
    );
};
