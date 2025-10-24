import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileUploadPage } from './pages/FileUploadPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 5 * 60 * 1000 // 5 minutes
        },
        mutations: {
            retry: 1
        }
    }
});

export const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <FileUploadPage />
        </QueryClientProvider>
    );
};
