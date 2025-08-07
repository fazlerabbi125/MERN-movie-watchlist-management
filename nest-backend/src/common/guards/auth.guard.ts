import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JWT_config } from '@src/config';
import { User } from '@src/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private jwtService: JwtService,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization?.split(' ');

        if (!authHeader || authHeader.length !== 2 || authHeader[0] !== 'Bearer') {
            throw new UnauthorizedException('Access token required');
        }

        const token = authHeader[1];

        try {
            const payload = this.jwtService.verify(token, {
                secret: JWT_config.access.secret,
            });

            // Check if user exists and is active in the database
            const user = await this.userRepository.findOne({
                where: { id: payload.sub, active: true },
                select: ['id', 'role', 'active'],
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // Map JWT payload to the expected user format
            request.user = {
                id: user.id,
                role: user.role,
            };
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }
}
