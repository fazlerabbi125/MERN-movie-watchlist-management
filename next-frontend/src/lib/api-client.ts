import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

// Token management utilities for client-side only
export const TokenManager = {
    ACCESS_TOKEN_KEY: 'access_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    
    // Get tokens from cookies (client-side only)
    getAccessToken: (): string | null => {
        return (getCookie(TokenManager.ACCESS_TOKEN_KEY) as string) || null;
    },
    
    getRefreshToken: (): string | null => {
        return (getCookie(TokenManager.REFRESH_TOKEN_KEY) as string) || null;
    },
    
    // Set tokens in cookies (client-side only)
    setTokens: (accessToken: string, refreshToken: string) => {
        const accessTokenExpiry = new Date();
        accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 1); // 1 hour
        
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
        
        setCookie(TokenManager.ACCESS_TOKEN_KEY, accessToken, {
            expires: accessTokenExpiry,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: false, // Needs to be accessible from client components
        });
        
        setCookie(TokenManager.REFRESH_TOKEN_KEY, refreshToken, {
            expires: refreshTokenExpiry,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            httpOnly: false,
        });
    },
    
    // Clear tokens (client-side only)
    clearTokens: () => {
        deleteCookie(TokenManager.ACCESS_TOKEN_KEY);
        deleteCookie(TokenManager.REFRESH_TOKEN_KEY);
    },
};// API response types
export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: any;
}

export interface ApiError {
    message: string;
    statusCode: number;
}

class ApiClient {
    private static instance: ApiClient;
    private axiosInstance: AxiosInstance;
    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (value?: any) => void;
        reject: (error?: any) => void;
    }> = [];

    private constructor() {
        this.axiosInstance = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
            timeout: 10000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        this.setupInterceptors();
    }

    public static getInstance(): ApiClient {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }
        return ApiClient.instance;
    }

    private setupInterceptors() {
        // Request interceptor to add auth token
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = TokenManager.getAccessToken();
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for token refresh
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as any;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        // If refresh is in progress, queue the request
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject });
                        })
                            .then((token) => {
                                if (originalRequest.headers) {
                                    originalRequest.headers.Authorization = `Bearer ${token}`;
                                }
                                return this.axiosInstance(originalRequest);
                            })
                            .catch((err) => Promise.reject(err));
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        const refreshToken = TokenManager.getRefreshToken();
                        if (!refreshToken) {
                            throw new Error("No refresh token available");
                        }

                        const response = await this.refreshTokens(refreshToken);
                        const { access_token, refresh_token } = response.data;

                        TokenManager.setTokens(access_token, refresh_token);

                        // Process failed queue
                        this.processQueue(null, access_token);

                        // Retry original request
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${access_token}`;
                        }
                        return this.axiosInstance(originalRequest);
                    } catch (refreshError) {
                        this.processQueue(refreshError, null);
                        TokenManager.clearTokens();

                        // Redirect to login page
                        if (typeof window !== "undefined") {
                            window.location.href = "/login";
                        }

                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private processQueue(error: any, token: string | null) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });

        this.failedQueue = [];
    }

    private async refreshTokens(refreshToken: string): Promise<AxiosResponse<AuthResponse>> {
        // Use a clean axios instance for refresh to avoid interceptor loops
        const cleanAxios = axios.create({
            baseURL: this.axiosInstance.defaults.baseURL,
        });

        return cleanAxios.post("/auth/refresh", { refreshToken });
    }

    // Public API methods
    public async get<T = any>(url: string, config = {}): Promise<AxiosResponse<T>> {
        return this.axiosInstance.get(url, config);
    }

    public async post<T = any>(url: string, data?: any, config = {}): Promise<AxiosResponse<T>> {
        return this.axiosInstance.post(url, data, config);
    }

    public async put<T = any>(url: string, data?: any, config = {}): Promise<AxiosResponse<T>> {
        return this.axiosInstance.put(url, data, config);
    }

    public async delete<T = any>(url: string, config = {}): Promise<AxiosResponse<T>> {
        return this.axiosInstance.delete(url, config);
    }

    public async patch<T = any>(url: string, data?: any, config = {}): Promise<AxiosResponse<T>> {
        return this.axiosInstance.patch(url, data, config);
    }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();
