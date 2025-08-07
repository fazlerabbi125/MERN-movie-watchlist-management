import { cookies } from 'next/headers';

// Server-side token management utilities
export const ServerTokenManager = {
    ACCESS_TOKEN_KEY: 'access_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    
    // Get tokens from cookies (server-side only)
    getAccessToken: async (): Promise<string | null> => {
        const cookieStore = await cookies();
        return cookieStore.get(ServerTokenManager.ACCESS_TOKEN_KEY)?.value || null;
    },
    
    getRefreshToken: async (): Promise<string | null> => {
        const cookieStore = await cookies();
        return cookieStore.get(ServerTokenManager.REFRESH_TOKEN_KEY)?.value || null;
    },
    
    // Set tokens in cookies (server-side only)
    setTokens: async (accessToken: string, refreshToken: string) => {
        const cookieStore = await cookies();
        
        // Set access token (1 hour expiry)
        cookieStore.set(ServerTokenManager.ACCESS_TOKEN_KEY, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60, // 1 hour
        });
        
        // Set refresh token (7 days expiry)
        cookieStore.set(ServerTokenManager.REFRESH_TOKEN_KEY, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });
    },
    
    // Clear tokens (server-side only)
    clearTokens: async () => {
        const cookieStore = await cookies();
        cookieStore.delete(ServerTokenManager.ACCESS_TOKEN_KEY);
        cookieStore.delete(ServerTokenManager.REFRESH_TOKEN_KEY);
    },
};
