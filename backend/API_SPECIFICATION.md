# API Specification

This document outlines the complete API specification for the backend system, including authentication, user management, file operations, and MCP JSON-RPC endpoints.

## Database Models

```prisma
model User {
  id              Int      @id @default(autoincrement())
  email           String   @unique
  name            String?
  password        String
  role            String   @default("USER")
  isEmailVerified Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tokens          Token[]
}

model Token {
  id          Int      @id @default(autoincrement())
  token       String
  type        String
  expires     DateTime
  blacklisted Boolean
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  userId      Int
}

model File {
  id          Int      @id @default(autoincrement())
  filename    String
  originalName String
  contentType String
  size        Int
  signedUrl   String?
  uploadedAt  DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
}
```

## Authentication Endpoints

EP: POST /auth/register
DESC: Register a new user account.
IN: body:{name:str!, email:str!, password:str!}
OUT: 201:{user:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}, tokens:{access:{token:str, expires:str}, refresh:{token:str, expires:str}}}
ERR: {"400":"Invalid input or duplicate email", "422":"Validation failed", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/register -H "Content-Type: application/json" -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
EX_RES_201: {"user":{"id":1,"email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":false,"createdAt":"2025-10-24T10:30:45Z","updatedAt":"2025-10-24T10:30:45Z"},"tokens":{"access":{"token":"eyJ...","expires":"2025-10-24T11:30:45Z"},"refresh":{"token":"eyJ...","expires":"2025-10-31T10:30:45Z"}}}

---

EP: POST /auth/login
DESC: Authenticate user with email and password.
IN: body:{email:str!, password:str!}
OUT: 200:{user:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}, tokens:{access:{token:str, expires:str}, refresh:{token:str, expires:str}}}
ERR: {"400":"Invalid input", "401":"Invalid email or password", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/login -H "Content-Type: application/json" -d '{"email":"john@example.com","password":"password123"}'
EX_RES_200: {"user":{"id":1,"email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":true,"createdAt":"2025-10-24T10:30:45Z","updatedAt":"2025-10-24T10:30:45Z"},"tokens":{"access":{"token":"eyJ...","expires":"2025-10-24T11:30:45Z"},"refresh":{"token":"eyJ...","expires":"2025-10-31T10:30:45Z"}}}

---

EP: POST /auth/logout
DESC: Logout user and invalidate refresh token.
IN: body:{refreshToken:str!}
OUT: 204:{}
ERR: {"400":"Invalid refresh token", "404":"Token not found", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/logout -H "Content-Type: application/json" -d '{"refreshToken":"eyJ..."}'
EX_RES_204: {}

---

EP: POST /auth/refresh-tokens
DESC: Refresh authentication tokens using refresh token.
IN: body:{refreshToken:str!}
OUT: 200:{access:{token:str, expires:str}, refresh:{token:str, expires:str}}
ERR: {"400":"Invalid refresh token", "401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/refresh-tokens -H "Content-Type: application/json" -d '{"refreshToken":"eyJ..."}'
EX_RES_200: {"access":{"token":"eyJ...","expires":"2025-10-24T11:30:45Z"},"refresh":{"token":"eyJ...","expires":"2025-10-31T10:30:45Z"}}

---

EP: POST /auth/forgot-password
DESC: Send password reset email to user.
IN: body:{email:str!}
OUT: 204:{}
ERR: {"400":"Invalid email", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/forgot-password -H "Content-Type: application/json" -d '{"email":"john@example.com"}'
EX_RES_204: {}

---

EP: POST /auth/reset-password
DESC: Reset user password using reset token.
IN: query:{token:str!}, body:{password:str!}
OUT: 204:{}
ERR: {"400":"Invalid input", "401":"Password reset failed or invalid token", "500":"Internal server error"}
EX_REQ: curl -X POST "/auth/reset-password?token=abc123" -H "Content-Type: application/json" -d '{"password":"newpassword123"}'
EX_RES_204: {}

---

EP: POST /auth/send-verification-email
DESC: Send email verification link to authenticated user.
IN: headers:{Authorization:str!}
OUT: 204:{}
ERR: {"401":"Unauthorized", "500":"Internal server error"}
EX_REQ: curl -X POST /auth/send-verification-email -H "Authorization: Bearer eyJ..."
EX_RES_204: {}

---

EP: POST /auth/verify-email
DESC: Verify user email using verification token.
IN: query:{token:str!}
OUT: 204:{}
ERR: {"400":"Invalid token", "401":"Verification failed", "500":"Internal server error"}
EX_REQ: curl -X POST "/auth/verify-email?token=abc123"
EX_RES_204: {}

## User Management Endpoints

EP: POST /users
DESC: Create a new user (admin only).
IN: headers:{Authorization:str!}, body:{email:str!, password:str!, name:str!, role:str!}
OUT: 201:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}
ERR: {"400":"Invalid input or duplicate email", "401":"Unauthorized", "403":"Forbidden", "500":"Internal server error"}
EX_REQ: curl -X POST /users -H "Authorization: Bearer eyJ..." -H "Content-Type: application/json" -d '{"email":"jane@example.com","password":"password123","name":"Jane Smith","role":"ADMIN"}'
EX_RES_201: {"id":2,"email":"jane@example.com","name":"Jane Smith","role":"ADMIN","isEmailVerified":false,"createdAt":"2025-10-24T10:35:45Z","updatedAt":"2025-10-24T10:35:45Z"}

---

EP: GET /users
DESC: Get paginated list of users with filtering.
IN: headers:{Authorization:str!}, query:{name:str, role:str, sortBy:str, limit:int, page:int}
OUT: 200:{results:arr[{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}], page:int, limit:int, totalPages:int, totalResults:int}
ERR: {"401":"Unauthorized", "403":"Forbidden", "500":"Internal server error"}
EX_REQ: curl -X GET "/users?page=1&limit=10&role=USER" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"results":[{"id":1,"email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":true,"createdAt":"2025-10-24T10:30:45Z","updatedAt":"2025-10-24T10:30:45Z"}],"page":1,"limit":10,"totalPages":1,"totalResults":1}

---

EP: GET /users/:userId
DESC: Get user by ID.
IN: headers:{Authorization:str!}, params:{userId:int!}
OUT: 200:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}
ERR: {"401":"Unauthorized", "403":"Forbidden", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X GET /users/1 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"id":1,"email":"john@example.com","name":"John Doe","role":"USER","isEmailVerified":true,"createdAt":"2025-10-24T10:30:45Z","updatedAt":"2025-10-24T10:30:45Z"}

---

EP: PATCH /users/:userId
DESC: Update user information.
IN: headers:{Authorization:str!}, params:{userId:int!}, body:{name:str, email:str, password:str}
OUT: 200:{id:int, email:str, name:str, role:str, isEmailVerified:bool, createdAt:str, updatedAt:str}
ERR: {"400":"Invalid input or duplicate email", "401":"Unauthorized", "403":"Forbidden", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X PATCH /users/1 -H "Authorization: Bearer eyJ..." -H "Content-Type: application/json" -d '{"name":"John Updated"}'
EX_RES_200: {"id":1,"email":"john@example.com","name":"John Updated","role":"USER","isEmailVerified":true,"createdAt":"2025-10-24T10:30:45Z","updatedAt":"2025-10-24T10:40:45Z"}

---

EP: DELETE /users/:userId
DESC: Delete user account.
IN: headers:{Authorization:str!}, params:{userId:int!}
OUT: 204:{}
ERR: {"401":"Unauthorized", "403":"Forbidden", "404":"User not found", "500":"Internal server error"}
EX_REQ: curl -X DELETE /users/1 -H "Authorization: Bearer eyJ..."
EX_RES_204: {}

## File Management Endpoints

EP: POST /files/upload
DESC: Upload a file to cloud storage.
IN: headers:{Authorization:str!, Content-Type:multipart/form-data}, body:{file:file!}
OUT: 201:{id:str, filename:str, signedUrl:str, contentType:str, size:int, uploadedAt:str}
ERR: {"400":"No file provided or invalid file", "401":"Unauthorized", "413":"File too large", "415":"Unsupported file type", "500":"Internal server error"}
EX_REQ: curl -X POST /files/upload -H "Authorization: Bearer eyJ..." -F "file=@document.pdf"
EX_RES_201: {"id":"file-123","filename":"document.pdf","signedUrl":"https://storage.example.com/signed-url-123","contentType":"application/pdf","size":1024000,"uploadedAt":"2025-10-24T10:45:45Z"}

---

EP: GET /files/:id
DESC: Get file metadata and signed URL.
IN: headers:{Authorization:str!}, params:{id:str!}
OUT: 200:{id:str, filename:str, signedUrl:str, contentType:str, size:int, uploadedAt:str}
ERR: {"401":"Unauthorized", "403":"Forbidden", "404":"File not found", "500":"Internal server error"}
EX_REQ: curl -X GET /files/file-123 -H "Authorization: Bearer eyJ..."
EX_RES_200: {"id":"file-123","filename":"document.pdf","signedUrl":"https://storage.example.com/signed-url-123","contentType":"application/pdf","size":1024000,"uploadedAt":"2025-10-24T10:45:45Z"}

---

EP: PUT /files/:id
DESC: Update/replace existing file.
IN: headers:{Authorization:str!, Content-Type:multipart/form-data}, params:{id:str!}, body:{file:file!}
OUT: 200:{id:str, filename:str, signedUrl:str, contentType:str, size:int, uploadedAt:str}
ERR: {"400":"No file provided or invalid file", "401":"Unauthorized", "403":"Forbidden", "404":"File not found", "413":"File too large", "415":"Unsupported file type", "500":"Internal server error"}
EX_REQ: curl -X PUT /files/file-123 -H "Authorization: Bearer eyJ..." -F "file=@updated-document.pdf"
EX_RES_200: {"id":"file-123","filename":"updated-document.pdf","signedUrl":"https://storage.example.com/signed-url-456","contentType":"application/pdf","size":2048000,"uploadedAt":"2025-10-24T10:50:45Z"}

## MCP (Model Context Protocol) Endpoints

EP: POST /mcp
DESC: Handle MCP JSON-RPC requests for model communication.
IN: headers:{Authorization:str!}, body:{jsonrpc:str!, method:str!, params:obj, id:str}
OUT: 200:{jsonrpc:str, result:obj, id:str}
ERR: {"400":"Invalid JSON-RPC request", "401":"Unauthorized", "404":"Method not found", "500":"Internal server error"}
EX_REQ: curl -X POST /mcp -H "Authorization: Bearer eyJ..." -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":"1"}'
EX_RES_200: {"jsonrpc":"2.0","result":{"protocolVersion":"2024-11-05","capabilities":{"logging":{},"prompts":{},"resources":{},"tools":{}}},"id":"1"}

---

EP: GET /mcp
DESC: Handle MCP JSON-RPC GET requests.
IN: headers:{Authorization:str!}, query:{method:str!, params:str}
OUT: 200:{jsonrpc:str, result:obj, id:str}
ERR: {"400":"Invalid request parameters", "401":"Unauthorized", "404":"Method not found", "500":"Internal server error"}
EX_REQ: curl -X GET "/mcp?method=ping&params={}" -H "Authorization: Bearer eyJ..."
EX_RES_200: {"jsonrpc":"2.0","result":{"status":"pong"},"id":"auto-generated"}

---

EP: DELETE /mcp
DESC: Handle MCP JSON-RPC DELETE requests for cleanup operations.
IN: headers:{Authorization:str!}, body:{jsonrpc:str!, method:str!, params:obj, id:str}
OUT: 200:{jsonrpc:str, result:obj, id:str}
ERR: {"400":"Invalid JSON-RPC request", "401":"Unauthorized", "404":"Method not found", "500":"Internal server error"}
EX_REQ: curl -X DELETE /mcp -H "Authorization: Bearer eyJ..." -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"cleanup","params":{"sessionId":"session-123"},"id":"2"}'
EX_RES_200: {"jsonrpc":"2.0","result":{"success":true,"message":"Session cleaned up"},"id":"2"}

## Common Error Responses

### 400 Bad Request

```json
{
    "code": 400,
    "message": "Bad Request",
    "details": "Invalid input data"
}
```

### 401 Unauthorized

```json
{
    "code": 401,
    "message": "Unauthorized",
    "details": "Please authenticate"
}
```

### 403 Forbidden

```json
{
    "code": 403,
    "message": "Forbidden",
    "details": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
    "code": 404,
    "message": "Not Found",
    "details": "Resource not found"
}
```

### 422 Validation Error

```json
{
    "code": 422,
    "message": "Validation Error",
    "details": {
        "field": "error message"
    }
}
```

### 500 Internal Server Error

```json
{
    "code": 500,
    "message": "Internal Server Error",
    "details": "Something went wrong"
}
```

## Authentication

All protected endpoints require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after 15 minutes. Use the refresh token to obtain new tokens via `/auth/refresh-tokens`.

## Rate Limiting

API endpoints are rate limited based on user authentication status and endpoint sensitivity. Rate limits apply per user/IP address.

## File Upload Constraints

- Maximum file size: 10MB
- Supported file types: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF
- Files are stored in cloud storage with signed URLs for secure access
