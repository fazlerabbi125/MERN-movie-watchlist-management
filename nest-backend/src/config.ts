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
