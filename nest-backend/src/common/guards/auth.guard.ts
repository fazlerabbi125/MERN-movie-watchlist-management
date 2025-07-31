import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JWT_config } from '../constants';
import { PrismaService } from '@/src/prisma/prisma.service';
import { JwtPayload } from 'jsonwebtoken';
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
                secret: JWT_config.access.secret,
            });
            if (!payload?.id) throw new Error('User identification not found in token');
            const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.id } });
            request.user = {
                id: user.id,
                role: user.role,
            };
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
