import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FileUploadPage } from './pages/FileUploadPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
            <BrowserRouter>
                <Routes>
                    <Route
                        path='/login'
                        element={<LoginPage />}
                    />
                    <Route
                        path='/'
                        element={
                            <ProtectedRoute>
                                <FileUploadPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='*'
                        element={
                            <Navigate
                                to='/'
                                replace
                            />
                        }
                    />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
};
