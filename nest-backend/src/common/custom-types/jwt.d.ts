import { Role } from 'generated/prisma';
import jwt from 'jsonwebtoken';

export type TokenPayload =
    | {
          id: number;
          role: Role;
      }
    | {
          id: undefined;
          role: undefined;
      };

declare module 'jsonwebtoken' {
    export interface JwtPayload extends TokenPayload {}
}
