import pkceChallenge from "pkce-challenge";

export interface PKCEData {
    codeVerifier: string;
    codeChallenge: string;
    state: string;
}

export class OAuthManager {
    private static readonly CODE_VERIFIER_KEY = "oauth_code_verifier";
    private static readonly STATE_KEY = "oauth_state";
    private static readonly PROVIDER_KEY = "oauth_provider";

    /**
     * Generate OAuth challenge
     */
    static async generateChallenge(): Promise<{
        codeVerifier: string;
        codeChallenge: string;
        state: string;
    }> {
        // Generate PKCE challenge pair
        const pkceData = await pkceChallenge();
        const codeVerifier = pkceData.code_verifier;
        const codeChallenge = pkceData.code_challenge;
        
        // Generate state parameter
        const state = crypto.randomUUID();

        return {
            codeVerifier,
            codeChallenge,
            state,
        };
    }

    /**
     * Store OAuth data in session storage
     */
    static storeOAuthData(data: PKCEData, provider: "google" | "discord") {
        if (typeof window === "undefined") return;

        sessionStorage.setItem(OAuthManager.CODE_VERIFIER_KEY, data.codeVerifier);
        sessionStorage.setItem(OAuthManager.STATE_KEY, data.state);
        sessionStorage.setItem(OAuthManager.PROVIDER_KEY, provider);
    }

    /**
     * Retrieve stored OAuth data
     */
    static getStoredOAuthData(): {
        codeVerifier: string;
        state: string;
        provider: "google" | "discord";
    } | null {
        if (typeof window === "undefined") return null;

        const codeVerifier = sessionStorage.getItem(OAuthManager.CODE_VERIFIER_KEY);
        const state = sessionStorage.getItem(OAuthManager.STATE_KEY);
        const provider = sessionStorage.getItem(OAuthManager.PROVIDER_KEY) as "google" | "discord";

        if (!codeVerifier || !state || !provider) {
            return null;
        }

        return { codeVerifier, state, provider };
    }

    /**
     * Clear stored OAuth data
     */
    static clearOAuthData() {
        if (typeof window === "undefined") return;

        sessionStorage.removeItem(OAuthManager.CODE_VERIFIER_KEY);
        sessionStorage.removeItem(OAuthManager.STATE_KEY);
        sessionStorage.removeItem(OAuthManager.PROVIDER_KEY);
    }

    /**
     * Validate state parameter
     */
    static validateState(receivedState: string): boolean {
        if (typeof window === "undefined") return false;

        const storedState = sessionStorage.getItem(OAuthManager.STATE_KEY);
        return storedState === receivedState;
    }

    /**
     * Generate a cryptographically secure code verifier
     */
    private static generateCodeVerifier(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, Array.from(array)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }

    /**
     * Generate a cryptographically secure state parameter
     */
    private static generateState(): string {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, Array.from(array)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }

    /**
     * Parse OAuth callback URL parameters
     */
    static parseCallbackParams(url: string): {
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
    } {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);

        return {
            code: params.get("code") || undefined,
            state: params.get("state") || undefined,
            error: params.get("error") || undefined,
            error_description: params.get("error_description") || undefined,
        };
    }
}
