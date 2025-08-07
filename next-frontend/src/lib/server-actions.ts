"use server";

/*
 * Server Actions for Authentication and API Calls
 * 
 * IMPORTANT: Next.js Cookie Limitations
 * - Cookies can only be modified in server actions and route handlers
 * - Server components can only READ cookies, not modify them
 * - This is why we separate client-side and server-side authentication
 * 
 * Architecture:
 * 1. Client-side (browser): Uses AuthService with automatic token refresh via axios interceptors
 * 2. Server-side (server actions): Uses ServerAuthService with manual token refresh
 * 3. ServerTokenManager: Handles HTTP-only cookies for secure token storage
 * 
 * Usage Guidelines:
 * - Use AuthService.* for client-side API calls (components, client-side effects)
 * - Use ServerAuthService.* for server actions where cookies can be modified
 * - Use getCurrentUser() for server components that need user data (read-only)
 */

import { redirect } from "next/navigation";
import { AuthService, LoginCredentials, RegisterCredentials } from "@/lib/auth";
import { ServerTokenManager } from "@/lib/server-token-manager";
import { ServerAuthService } from "@/lib/server-auth";

export interface ActionResult {
    success: boolean;
    error?: string;
    data?: any;
}

/**
 * Server action for login
 */
export async function loginAction(credentials: LoginCredentials): Promise<ActionResult> {
    try {
        const response = await AuthService.login(credentials);

        // Set cookies on server side using ServerTokenManager
        await ServerTokenManager.setTokens(response.access_token, response.refresh_token);

        return {
            success: true,
            data: response,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Server action for registration
 */
export async function registerAction(credentials: RegisterCredentials): Promise<ActionResult> {
    try {
        const response = await AuthService.register(credentials);

        // Set cookies on server side using ServerTokenManager
        await ServerTokenManager.setTokens(response.access_token, response.refresh_token);

        return {
            success: true,
            data: response,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Server action for logout
 */
export async function logoutAction(): Promise<void> {
    try {
        await ServerAuthService.logout();
    } catch (error) {
        console.error("Logout error:", error);
        // Clear tokens even if logout fails
        await ServerTokenManager.clearTokens();
    }

    redirect("/login");
}

/**
 * Get current user from server
 */
export async function getCurrentUser() {
    try {
        const accessToken = await ServerTokenManager.getAccessToken();

        if (!accessToken) {
            return null;
        }

        // Use server-side API call with token
        const user = await ServerAuthService.getCurrentUser();
        return user;
    } catch (error) {
        console.error("Get current user error:", error);
        return null;
    }
}

/**
 * Check if user is authenticated on server
 */
export async function isAuthenticated(): Promise<boolean> {
    const accessToken = await ServerTokenManager.getAccessToken();
    return !!accessToken;
}

/**
 * Server-side authenticated API call
 * Use this in server actions where cookies can be modified and token refresh is needed
 */
export async function authenticatedApiCall(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
): Promise<ActionResult> {
    try {
        const result = await ServerAuthService.authenticatedRequest(method, endpoint, data);
        return {
            success: true,
            data: result,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Simple server-side fetch without token refresh
 * Use this only when you're sure tokens are valid or for non-authenticated calls
 */
export async function simpleFetch(endpoint: string, options: RequestInit = {}) {
    const accessToken = await ServerTokenManager.getAccessToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return response;
}

/**
 * Server action to refresh tokens
 */
export async function refreshTokensAction(): Promise<ActionResult> {
    try {
        const response = await ServerAuthService.refreshTokens();
        
        return {
            success: true,
            data: response,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Check if tokens are valid and refresh if needed
 * This should be called from server actions before making API calls
 */
export async function ensureValidTokens(): Promise<boolean> {
    const accessToken = await ServerTokenManager.getAccessToken();
    
    if (accessToken) {
        // TODO: Could add JWT decode to check expiration before making request
        return true;
    }
    
    // Try to refresh tokens
    const refreshResult = await refreshTokensAction();
    return refreshResult.success;
}

/**
 * Example: Get user profile (server action)
 */
export async function getUserProfileAction(): Promise<ActionResult> {
    return authenticatedApiCall('GET', '/auth/me');
}

/**
 * Example: Update user profile (server action)
 */
export async function updateUserProfileAction(userData: any): Promise<ActionResult> {
    return authenticatedApiCall('PUT', '/users/profile', userData);
}
