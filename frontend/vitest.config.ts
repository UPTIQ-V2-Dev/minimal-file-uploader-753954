import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        css: true,
        include: [] // No tests included per no-testing policy
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
