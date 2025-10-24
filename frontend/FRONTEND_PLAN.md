# Minimal File Upload App - Implementation Plan

## Project Overview

Extremely minimal React 19 + Vite + shadcn + Tailwind v4 application for uploading image or PDF files (<5 MB) with mandatory cloud storage integration.

## Tech Stack

- **React**: 19.1.0 with new features
- **Build Tool**: Vite 7.0.4
- **Styling**: Tailwind CSS v4.1.11 + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios (already configured)
- **Testing**: None (No testing policy in effect)

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

**No Testing Required**: All testing requirements removed per no-testing policy

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

## NO TESTING POLICY

**CRITICAL IMPLEMENTATION RULE - NON-NEGOTIABLE:**

- **NO TEST CASES OF ANY KIND SHOULD EXIST IN THIS CODEBASE**
- **NO unit tests, integration tests, e2e tests, mocks, or any test-related configurations**
- **NO test files, folders, or references should remain anywhere in the frontend**
- **DO NOT regenerate or rewrite any test cases under any circumstances**
- **If any framework requires a test file to exist, create only a single dummy test that always passes** (e.g., `expect(true).toBe(true)`)
- **Remove all test-related setup scripts, test commands from package.json, and CI/CD test steps**
- **This rule OVERRIDES all other implementation or framework conventions — absolutely no test code should exist in the final version**

This policy applies to all current and future development on this project. Any mention of testing in implementation requirements should be ignored in favor of this no-testing rule.

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

### Phase 4: Polish & Finalization

- Error boundary and edge cases
- Performance optimization

### Phase 5: Final Integration

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
