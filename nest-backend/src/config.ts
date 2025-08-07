import * as ms from 'ms';

export const JWT_config = {
    access: {
        secret: process.env.JWT_ACCESS_SECRET_KEY ?? '',
        expiresIn: process.env.JWT_ACCESS_EXPIRATION ?? '',
    },
    refresh: {
        secret: process.env.JWT_REFRESH_SECRET_KEY ?? '',
        expiresIn: ms(process.env.JWT_REFRESH_EXPIRATION as ms.StringValue) ?? '',
    },
};

export const ADMIN_OP_API_KEY = process.env.ADMIN_OP_API_KEY ?? '';

export const OAUTH_CONFIG = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
    },
    discord: {
        clientId: process.env.DISCORD_CLIENT_ID ?? '',
        clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
        redirectUri: process.env.DISCORD_REDIRECT_URI ?? '',
    },
    frontend: {
        baseUrl: process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000',
        successRedirect: process.env.FRONTEND_SUCCESS_REDIRECT ?? '/dashboard',
        errorRedirect: process.env.FRONTEND_ERROR_REDIRECT ?? '/login?error=oauth_error',
    },
};
