// Simplified test utilities for React 19 compatibility
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement, ReactNode } from 'react';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

const Wrapper = ({ children }: { children: ReactNode }) => {
    const testQueryClient = createTestQueryClient();
    return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>;
};

export const renderWithProviders = (ui: ReactElement) => {
    return render(ui, { wrapper: Wrapper });
};

export * from '@testing-library/react';
