# Minimal File Upload App - Implementation Plan

## Project Overview

Extremely minimal React 19 + Vite + shadcn + Tailwind v4 application for uploading image or PDF files (<5 MB) with mandatory cloud storage integration.

## Tech Stack

- **React**: 19.1.0 with new features
- **Build Tool**: Vite 7.0.4
- **Styling**: Tailwind CSS v4.1.11 + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios (already configured)
- **Testing**: Vitest + React Testing Library + MSW

## Architecture Overview

Single-page application with file upload functionality, cloud storage integration, and signed URL handling.

## Core Features Implementation

### 1. Authentication System

**File**: `src/pages/LoginPage.tsx`

**Components Required**:

- `LoginForm` - Email/password login form with validation
- `AuthLayout` - Shared layout for auth pages
- Authentication state management with React Query

**Features**:

- Email/password login with form validation
- Remember me functionality
- Error handling for authentication failures
- Automatic redirect after successful login
- Integration with existing auth service

**Types Required**:

- Already implemented in `src/types/user.ts`
- LoginRequest, AuthResponse interfaces exist

**API Services**:

- Already implemented in `src/services/auth.ts`
- Login, logout, token refresh functionality

**Testing Strategy**:

- Login form validation tests
- Authentication flow tests
- Error handling tests
- Protected route redirect tests

### 2. File Upload Page (Protected Page)

**File**: `src/pages/FileUpload.tsx`

**Components Required**:

- `FileDropzone` - Main file selection/drag-drop area
- `FilePreview` - Shows selected file info before upload
- `UploadProgress` - Progress indicator during upload
- `UploadResult` - Success/error states with signed URL

**Utils Required**:

- `src/utils/fileValidation.ts` - File type/size validation
- `src/utils/fileHelpers.ts` - File processing utilities

**Types Required**:

- `src/types/file.ts` - File upload related types
- Update `src/types/api.ts` - API response types for file endpoints

**API Services**:

- `src/services/fileService.ts` - File upload API calls
- API endpoints: POST `/files/upload`, GET `/files/:id`, PUT `/files/:id`

### 2. Layout Structure

**File**: `src/components/layout/AppLayout.tsx`

- Minimal container with proper responsive design
- Error boundary wrapper

### 3. Error Handling

**File**: `src/components/common/ErrorBoundary.tsx`

- Global error handling for upload failures

### 4. API Integration

**Update**: `src/lib/api.ts`

- Configure base axios instance
- Add file upload specific headers and timeouts
- Error handling for API failures

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx
│   ├── common/
│   │   └── ErrorBoundary.tsx
│   └── upload/
│       ├── FileDropzone.tsx
│       ├── FilePreview.tsx
│       ├── UploadProgress.tsx
│       └── UploadResult.tsx
├── pages/
│   └── FileUpload.tsx
├── services/
│   └── fileService.ts
├── types/
│   └── file.ts
├── utils/
│   ├── fileValidation.ts
│   └── fileHelpers.ts
└── hooks/
    └── useFileUpload.ts
```

## State Management

- Local React state with custom hooks (`useFileUpload.ts`, `useAuth.ts`)
- React Query for authentication state management
- No external state management needed for this minimal app

## Form Validation Rules

- File types: `.jpg`, `.jpeg`, `.png`, `.gif`, `.pdf`
- Max file size: 5MB
- Single file upload only

## API Response Structure

```typescript
interface FileUploadResponse {
    id: string;
    filename: string;
    signedUrl: string;
    contentType: string;
    size: number;
    uploadedAt: string;
}
```

## Testing Strategy

### Test File Organization

```
src/
├── __tests__/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.test.tsx
│   │   │   └── AuthLayout.test.tsx
│   │   └── upload/
│   │       ├── FileDropzone.test.tsx
│   │       ├── FilePreview.test.tsx
│   │       ├── UploadProgress.test.tsx
│   │       └── UploadResult.test.tsx
│   ├── pages/
│   │   ├── LoginPage.test.tsx
│   │   └── FileUpload.test.tsx
│   ├── services/
│   │   ├── auth.test.ts
│   │   └── fileService.test.ts
│   ├── utils/
│   │   ├── fileValidation.test.ts
│   │   └── fileHelpers.test.ts
│   └── hooks/
│       ├── useAuth.test.ts
│       └── useFileUpload.test.ts
├── __mocks__/
│   ├── authMocks.ts
│   ├── fileMocks.ts
│   └── handlers.ts (MSW handlers)
└── test-utils.tsx
```

### Testing Setup Files

- `src/setupTests.ts` - Global test configuration
- `src/test-utils.tsx` - Custom render functions with providers
- `vitest.config.ts` - Already configured

### Unit/Component Tests (Vitest + RTL)

**LoginForm Component Tests**:

- Renders form fields correctly
- Validates email format
- Validates password requirements
- Handles form submission
- Shows appropriate error messages
- Disables submit during loading state
- Remember me functionality

**AuthLayout Component Tests**:

- Renders layout structure correctly
- Handles responsive design
- Displays proper styling

**LoginPage Tests**:

- Complete authentication flow integration
- Redirects after successful login
- Error handling for failed login
- Loading states management

**FileDropzone Component Tests**:

- Renders drop zone correctly
- Handles file selection via input
- Handles drag and drop events
- Validates file types and sizes
- Shows appropriate error messages
- Disables during upload state

**FilePreview Component Tests**:

- Displays file information correctly
- Shows file size in human-readable format
- Renders different icons for file types
- Handles remove file action

**UploadProgress Component Tests**:

- Shows progress percentage
- Displays upload status messages
- Handles upload cancellation

**UploadResult Component Tests**:

- Displays success state with signed URL
- Shows error messages on failure
- Provides retry functionality
- Handles copy-to-clipboard for signed URL

**FileUpload Page Tests**:

- Complete upload flow integration
- Error boundary behavior
- Loading states
- Navigation and routing

### Service/API Tests

**authService Tests**:

- Mock API calls using MSW
- Test login with valid credentials
- Test login with invalid credentials
- Test logout functionality
- Test token refresh handling
- Test error handling (network, server errors)

**fileService Tests**:

- Mock API calls using MSW
- Test upload with progress callbacks
- Test error handling (network, server errors)
- Test file validation on API level
- Test signed URL retrieval

### Hook Tests

**useAuth Hook Tests**:

- Authentication state management
- Login flow handling
- Logout functionality
- Token refresh behavior
- Error state management
- Loading states

**useFileUpload Hook Tests**:

- File selection state management
- Upload progress tracking
- Error state handling
- Success state with signed URL
- File validation integration

### Utility Tests

**fileValidation Tests**:

- File type validation (images, PDFs)
- File size validation (<5MB)
- MIME type validation
- Edge cases (corrupted files, empty files)

**fileHelpers Tests**:

- File size formatting
- File type detection
- File preview generation

### MSW (Mock Service Worker) Setup

**API Mocking Strategy**:

```typescript
// src/__mocks__/handlers.ts
export const handlers = [
    http.post('/api/files/upload', () => {
        return HttpResponse.json({
            id: '123',
            filename: 'test.jpg',
            signedUrl: 'https://cloud.storage/signed-url',
            contentType: 'image/jpeg',
            size: 1024000,
            uploadedAt: '2023-01-01T00:00:00Z'
        });
    }),

    http.get('/api/files/:id', () => {
        return HttpResponse.json({
            id: '123',
            filename: 'test.jpg',
            signedUrl: 'https://cloud.storage/signed-url'
        });
    })
];
```

### Key Test Scenarios

**Form Validation Tests**:

- Upload invalid file types
- Upload files exceeding 5MB limit
- Upload with no file selected
- Upload multiple files (should reject)

**State Transition Tests**:

- Idle → File Selected → Uploading → Success
- Idle → File Selected → Uploading → Error
- Error → Retry → Success
- Success → Upload Another File

**Error Handling Tests**:

- Network timeout during upload
- Server 500 errors
- Invalid API responses
- File corruption during upload

**Integration Tests**:

- Complete user journey from file selection to signed URL
- Error recovery scenarios
- Accessibility compliance
- Mobile responsiveness

### Test Utilities and Custom Matchers

**File Mock Creation**:

```typescript
// src/__mocks__/fileMocks.ts
export const createMockFile = (name: string, type: string, size: number): File => {
    return new File(['mock content'], name, { type, size });
};
```

**Custom Render with Providers**:

```typescript
// src/test-utils.tsx
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={testQueryClient}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </QueryClientProvider>
    )
  });
};
```

### Test Coverage Goals

- **Components**: 95%+ coverage
- **Services**: 100% coverage
- **Utilities**: 100% coverage
- **Hooks**: 95%+ coverage

### Example Test Patterns

**Component Test Example**:

```typescript
describe('FileDropzone', () => {
  it('should accept valid image files', async () => {
    const onFileSelect = vi.fn();
    renderWithProviders(<FileDropzone onFileSelect={onFileSelect} />);

    const file = createMockFile('test.jpg', 'image/jpeg', 1000000);
    const input = screen.getByLabelText(/select file/i);

    await userEvent.upload(input, file);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });
});
```

**Service Test Example**:

```typescript
describe('fileService', () => {
    it('should upload file and return signed URL', async () => {
        const file = createMockFile('test.pdf', 'application/pdf', 2000000);

        const result = await uploadFile(file);

        expect(result.signedUrl).toBeDefined();
        expect(result.filename).toBe('test.pdf');
    });
});
```

## Implementation Phases

### Phase 1: Core Setup

- Set up routing (if needed)
- Create basic layout structure
- Implement file validation utilities

### Phase 2: Upload Components

- Build FileDropzone with drag/drop
- Create FilePreview component
- Add UploadProgress indicator

### Phase 3: API Integration

- Set up file upload service
- Implement signed URL handling
- Add error handling

### Phase 4: Polish & Testing

- Complete test suite implementation
- Error boundary and edge cases
- Performance optimization

### Phase 5: Final Integration

- End-to-end testing
- Build and deployment preparation
- Documentation cleanup

## Performance Considerations

- Lazy loading for large file previews
- Upload progress streaming
- File chunking for large uploads (if backend supports)
- Memory cleanup after upload

## Security Considerations

- Client-side file validation (type, size)
- Signed URL security
- HTTPS-only file transfers
- No sensitive data logging
