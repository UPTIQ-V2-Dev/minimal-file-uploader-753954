export const createMockFile = (name: string, type: string, size: number): File => {
    const file = new File(['mock content'], name, { type });
    Object.defineProperty(file, 'size', {
        value: size,
        writable: false
    });
    return file;
};

export const validImageFile = createMockFile('test.jpg', 'image/jpeg', 1024000);
export const validPdfFile = createMockFile('test.pdf', 'application/pdf', 2048000);
export const oversizedFile = createMockFile('large.jpg', 'image/jpeg', 6 * 1024 * 1024);
export const invalidTypeFile = createMockFile('test.txt', 'text/plain', 1024);
export const gifFile = createMockFile('test.gif', 'image/gif', 512000);
export const pngFile = createMockFile('test.png', 'image/png', 1024000);
