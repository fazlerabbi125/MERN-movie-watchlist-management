import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { User } from '@src/entities/user.entity';
import { RefreshToken } from '@src/entities/refreshToken.entity';
import { JwtAuthGuard } from '@src/common/guards';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, RefreshToken]),
        JwtModule.register({}), // Configure JWT globally in app.module.ts
    ],
    controllers: [AuthController],
    providers: [AuthService, OAuthService, JwtAuthGuard],
    exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
