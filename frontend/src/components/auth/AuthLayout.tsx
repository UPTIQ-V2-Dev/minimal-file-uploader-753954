import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    description?: string;
}

export const AuthLayout = ({ children, title, description }: AuthLayoutProps) => {
    return (
        <div className='min-h-screen flex items-center justify-center bg-background px-4'>
            <Card className='w-full max-w-md'>
                <CardHeader className='space-y-1'>
                    <CardTitle className='text-2xl font-bold text-center'>{title}</CardTitle>
                    {description && <CardDescription className='text-center'>{description}</CardDescription>}
                </CardHeader>
                <CardContent>{children}</CardContent>
            </Card>
        </div>
    );
};
