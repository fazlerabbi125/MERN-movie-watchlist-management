import { apiClient, AuthResponse, TokenManager } from './api-client';
import { OAuthManager } from './oauth';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
}

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    role: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export class AuthService {
    /**
     * Login with email and password
     */
    static async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
            const { access_token, refresh_token } = response.data;
            
            TokenManager.setTokens(access_token, refresh_token);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }

    /**
     * Register new user
     */
    static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
            const { access_token, refresh_token } = response.data;
            
            TokenManager.setTokens(access_token, refresh_token);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    /**
     * Logout user
     */
    static async logout(): Promise<void> {
        try {
            const refreshToken = TokenManager.getRefreshToken();
            if (refreshToken) {
                await apiClient.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            TokenManager.clearTokens();
        }
    }

    /**
     * Start OAuth flow
     */
    static async startOAuthFlow(provider: 'google' | 'discord'): Promise<string> {
        try {
            // Generate PKCE data
            const pkceData = await OAuthManager.generateChallenge();
            
            // Store OAuth data for callback
            OAuthManager.storeOAuthData(pkceData, provider);
            
            // Get authorization URL from backend
            const response = await apiClient.get<{ authUrl: string; state: string }>('/auth/oauth/url', {
                params: {
                    provider,
                    codeChallenge: pkceData.codeChallenge,
                },
            });
            
            return response.data.authUrl;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || `Failed to start ${provider} OAuth flow`);
        }
    }

    /**
     * Handle OAuth callback
     */
    static async handleOAuthCallback(callbackUrl: string): Promise<AuthResponse> {
        try {
            // Parse callback parameters
            const params = OAuthManager.parseCallbackParams(callbackUrl);
            
            if (params.error) {
                throw new Error(params.error_description || params.error);
            }
            
            if (!params.code || !params.state) {
                throw new Error('Missing required OAuth parameters');
            }
            
            // Validate state
            if (!OAuthManager.validateState(params.state)) {
                throw new Error('Invalid OAuth state parameter');
            }
            
            // Get stored OAuth data
            const oauthData = OAuthManager.getStoredOAuthData();
            if (!oauthData) {
                throw new Error('OAuth session data not found');
            }
            
            // Exchange authorization code for tokens
            const response = await apiClient.post<AuthResponse>('/auth/oauth/callback', {
                provider: oauthData.provider,
                code: params.code,
                state: params.state,
                codeVerifier: oauthData.codeVerifier,
            });
            
            const { access_token, refresh_token } = response.data;
            
            // Store tokens
            TokenManager.setTokens(access_token, refresh_token);
            
            // Clear OAuth session data
            OAuthManager.clearOAuthData();
            
            return response.data;
        } catch (error: any) {
            // Clear OAuth session data on error
            OAuthManager.clearOAuthData();
            throw new Error(error.response?.data?.message || 'OAuth callback failed');
        }
    }

    /**
     * Get current user
     */
    static async getCurrentUser(): Promise<User> {
        try {
            const response = await apiClient.get<User>('/auth/me');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get current user');
        }
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        return !!TokenManager.getAccessToken();
    }

    /**
     * Refresh tokens
     */
    static async refreshTokens(): Promise<AuthResponse> {
        try {
            const refreshToken = TokenManager.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
            const { access_token, refresh_token } = response.data;
            
            TokenManager.setTokens(access_token, refresh_token);
            return response.data;
        } catch (error: any) {
            TokenManager.clearTokens();
            throw new Error(error.response?.data?.message || 'Token refresh failed');
        }
    }
}
