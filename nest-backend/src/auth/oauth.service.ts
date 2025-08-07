import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { OAUTH_CONFIG } from '@src/config';
import * as crypto from 'crypto';

export interface OAuthUserProfile {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    emailVerified?: boolean;
}

@Injectable()
export class OAuthService {
    private readonly googleTokenUrl = 'https://oauth2.googleapis.com/token';
    private readonly googleUserUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    private readonly discordTokenUrl = 'https://discord.com/api/oauth2/token';
    private readonly discordUserUrl = 'https://discord.com/api/users/@me';

    generateState(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    validateState(providedState: string, expectedState: string): boolean {
        return providedState === expectedState;
    }

    generateAuthUrl(provider: 'google' | 'discord', state: string, codeChallenge: string): string {
        const config = OAUTH_CONFIG[provider];
        const scopes = provider === 'google' ? 'openid email profile' : 'identify email';

        const baseUrl =
            provider === 'google'
                ? 'https://accounts.google.com/o/oauth2/v2/auth'
                : 'https://discord.com/api/oauth2/authorize';

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            scope: scopes,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

        return `${baseUrl}?${params.toString()}`;
    }

    async exchangeCodeForTokens(
        provider: 'google' | 'discord',
        code: string,
        codeVerifier: string,
    ): Promise<string> {
        const config = OAUTH_CONFIG[provider];
        const tokenUrl = provider === 'google' ? this.googleTokenUrl : this.discordTokenUrl;

        try {
            const response = await axios.post(
                tokenUrl,
                {
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: config.redirectUri,
                    code_verifier: codeVerifier,
                },
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            return response.data.access_token;
        } catch {
            // Log error to internal system if needed
            throw new UnauthorizedException(`Failed to exchange ${provider} authorization code`);
        }
    }

    async getUserProfile(
        provider: 'google' | 'discord',
        accessToken: string,
    ): Promise<OAuthUserProfile> {
        const userUrl = provider === 'google' ? this.googleUserUrl : this.discordUserUrl;

        try {
            const response = await axios.get(userUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const userData = response.data;

            if (provider === 'google') {
                const nameParts = userData.name ? userData.name.split(' ') : ['', ''];
                return {
                    id: userData.id,
                    email: userData.email,
                    first_name: nameParts[0] || '',
                    last_name: nameParts.slice(1).join(' ') || '',
                    avatar: userData.picture,
                    emailVerified: userData.verified_email,
                };
            } else {
                // Discord
                return {
                    id: userData.id,
                    email: userData.email,
                    first_name: userData.username || '',
                    last_name: '', // Discord doesn't have last name
                    avatar: userData.avatar
                        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
                        : undefined,
                    emailVerified: userData.verified,
                };
            }
        } catch {
            // Log error to internal system if needed
            throw new UnauthorizedException(`Failed to fetch ${provider} user profile`);
        }
    }
}
