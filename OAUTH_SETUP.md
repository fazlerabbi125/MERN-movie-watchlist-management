# OAuth2 Authentication Implementation Guide

This implementation provides Google and Discord OAuth2 login with PKCE, along with credential-based authentication for both NestJS backend and Next.js 15 frontend.

## Features Implemented

### Backend (NestJS)
- ✅ Credential-based login/registration
- ✅ Google OAuth2 with PKCE
- ✅ Discord OAuth2 with PKCE  
- ✅ JWT access & refresh tokens
- ✅ Secure token refresh mechanism
- ✅ User profile management with OAuth providers

### Frontend (Next.js 15)
- ✅ Client-side authentication with automatic token refresh
- ✅ Server-side authentication for server components
- ✅ PKCE implementation for OAuth flows
- ✅ Secure cookie-based token storage
- ✅ OAuth callback handling

## Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd nest-backend
pnpm install
```

#### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=movie_watchlist

# JWT
JWT_ACCESS_SECRET_KEY=your-super-secret-access-key
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_SECRET_KEY=your-super-secret-refresh-key
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback

# Frontend
FRONTEND_BASE_URL=http://localhost:3000
```

#### Database Migration
Run database migrations to add OAuth fields to User entity:
```bash
npm run migration:generate -- AddOAuthFields
npm run migration:run
```

### 2. Frontend Setup

#### Install Dependencies
```bash
cd next-frontend
pnpm install
```

#### Environment Variables
Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_OAUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

### 3. OAuth Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

#### Discord OAuth Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 section
4. Add redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

## API Endpoints

### Authentication Endpoints

#### Credential-based Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate refresh token

#### OAuth Authentication
- `GET /auth/oauth/url?provider=google&codeChallenge=xxx` - Get OAuth authorization URL
- `POST /auth/oauth/callback` - Handle OAuth callback

### Request/Response Format

All authentication endpoints return:
```json
{
  "access_token": "jwt-access-token",
  "refresh_token": "jwt-refresh-token", 
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "avatar": "https://...",
    "role": "member",
    "emailVerified": true,
    // ... other user fields except password
  }
}
```

## Frontend Usage

### Client Components
```tsx
import { AuthService } from '@/lib/auth';

// Credential login
const result = await AuthService.login({ email, password });

// OAuth login
const authUrl = await AuthService.startOAuthFlow('google');
window.location.href = authUrl;

// Check authentication
const isAuth = AuthService.isAuthenticated();
```

### Server Components & Actions
```tsx
import { getCurrentUser, isAuthenticated } from '@/lib/server-actions';

// In server component
const user = await getCurrentUser();
const authenticated = await isAuthenticated();
```

### API Calls
The API client automatically handles:
- Adding Authorization headers
- Token refresh on 401 errors
- Redirecting to login on auth failure

```tsx
import { apiClient } from '@/lib/api-client';

// API calls automatically include auth headers
const response = await apiClient.get('/protected-endpoint');
```

## Security Features

### Backend
- ✅ PKCE challenge validation
- ✅ State parameter validation
- ✅ Secure JWT implementation
- ✅ Refresh token rotation
- ✅ Password hashing with bcrypt
- ✅ Input validation with class-validator

### Frontend  
- ✅ Secure cookie storage (httpOnly for server-side)
- ✅ Automatic token refresh
- ✅ CSRF protection via SameSite cookies
- ✅ Cryptographically secure PKCE generation

## OAuth Flow

1. Frontend generates PKCE challenge and state
2. Frontend requests auth URL from backend
3. User redirected to OAuth provider
4. Provider redirects to `/auth/callback` with code
5. Frontend extracts code and exchanges with backend
6. Backend validates code with OAuth provider
7. Backend creates/updates user and returns tokens
8. Frontend stores tokens and redirects to dashboard

## Error Handling

- OAuth errors redirect to `/login?error=oauth_error`
- Token refresh failures redirect to `/login`
- Network errors are caught and displayed to user
- Invalid state parameters are rejected

## Testing

Test the implementation with:
1. Credential registration/login
2. Google OAuth flow
3. Discord OAuth flow  
4. Token refresh mechanism
5. Logout functionality
6. Protected route access

## Production Considerations

1. Use HTTPS in production
2. Set secure environment variables
3. Configure proper CORS origins
4. Set up database connection pooling
5. Implement rate limiting
6. Add logging and monitoring
7. Use secure cookie settings
