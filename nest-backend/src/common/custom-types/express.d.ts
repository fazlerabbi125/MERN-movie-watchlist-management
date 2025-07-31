import * as express from 'express';
import { Role } from '../../../generated/prisma';

declare module 'express' {
    export interface Request {
        user?: {
            id: number;
            role: Role;
        };
    }
}
