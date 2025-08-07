import axios, { AxiosInstance } from 'axios';
import { ServerTokenManager } from './server-token-manager';

// Server-side axios instance without automatic token refresh
// (since cookies can only be modified in server actions)
const serverApiClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Server-side authentication service
 * Used in server actions and route handlers where cookies can be modified
 */
export class ServerAuthService {
    /**
     * Refresh tokens using server-side token manager
     */
    static async refreshTokens() {
        const refreshToken = await ServerTokenManager.getRefreshToken();
        
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await serverApiClient.post('/auth/refresh', { 
                refreshToken 
            });
            
            const { access_token, refresh_token } = response.data;
            
            // Update server-side cookies
            await ServerTokenManager.setTokens(access_token, refresh_token);
            
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Token refresh failed');
        }
    }

    /**
     * Get current user with server-side token
     */
    static async getCurrentUser() {
        const accessToken = await ServerTokenManager.getAccessToken();
        
        if (!accessToken) {
            throw new Error('No access token available');
        }

        try {
            const response = await serverApiClient.get('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get current user');
        }
    }

    /**
     * Logout with server-side token
     */
    static async logout() {
        const refreshToken = await ServerTokenManager.getRefreshToken();
        
        if (refreshToken) {
            try {
                await serverApiClient.post('/auth/logout', { refreshToken });
            } catch (error) {
                // Ignore logout errors - we'll clear tokens anyway
                console.error('Logout error:', error);
            }
        }
        
        await ServerTokenManager.clearTokens();
    }

    /**
     * Make authenticated request with automatic token refresh
     * Use this in server actions where cookies can be modified
     */
    static async authenticatedRequest(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        endpoint: string,
        data?: any
    ) {
        let accessToken = await ServerTokenManager.getAccessToken();
        
        // If no access token, try to refresh
        if (!accessToken) {
            try {
                await this.refreshTokens();
                accessToken = await ServerTokenManager.getAccessToken();
            } catch (error) {
                throw new Error('Authentication required - please login');
            }
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                ...(data && { data }),
            };

            let response;
            switch (method) {
                case 'GET':
                    response = await serverApiClient.get(endpoint, config);
                    break;
                case 'POST':
                    response = await serverApiClient.post(endpoint, data, config);
                    break;
                case 'PUT':
                    response = await serverApiClient.put(endpoint, data, config);
                    break;
                case 'DELETE':
                    response = await serverApiClient.delete(endpoint, config);
                    break;
            }

            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                // Token expired, try to refresh once
                try {
                    await this.refreshTokens();
                    accessToken = await ServerTokenManager.getAccessToken();
                    
                    const config = {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    };

                    let retryResponse;
                    switch (method) {
                        case 'GET':
                            retryResponse = await serverApiClient.get(endpoint, config);
                            break;
                        case 'POST':
                            retryResponse = await serverApiClient.post(endpoint, data, config);
                            break;
                        case 'PUT':
                            retryResponse = await serverApiClient.put(endpoint, data, config);
                            break;
                        case 'DELETE':
                            retryResponse = await serverApiClient.delete(endpoint, config);
                            break;
                    }

                    return retryResponse.data;
                } catch (refreshError) {
                    // Refresh failed, clear tokens
                    await ServerTokenManager.clearTokens();
                    throw new Error('Authentication failed - please login');
                }
            }
            
            throw new Error(error.response?.data?.message || 'Request failed');
        }
    }
}
