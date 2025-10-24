import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFile, getFile, updateFile } from '../../services/fileService';
import { createMockFile } from '../../__mocks__/fileMocks';

// Mock the environment variable
vi.stubGlobal('import.meta', {
    env: {
        VITE_USE_MOCK_DATA: 'true'
    }
});

describe('fileService - Simple Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should have uploadFile function', () => {
        expect(typeof uploadFile).toBe('function');
    });

    it('should have getFile function', () => {
        expect(typeof getFile).toBe('function');
    });

    it('should have updateFile function', () => {
        expect(typeof updateFile).toBe('function');
    });

    it('should accept file parameter', async () => {
        const file = createMockFile('test.jpg', 'image/jpeg', 1024000);

        // Should not throw an error
        expect(() => uploadFile(file)).not.toThrow();
    });
});
