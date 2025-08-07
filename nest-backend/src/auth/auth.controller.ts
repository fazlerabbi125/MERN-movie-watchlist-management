import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Res,
    HttpStatus,
    ValidationPipe,
    Request,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, OAuthCallbackDto, RefreshTokenDto } from './dto/auth.dto';
import { OAUTH_CONFIG } from '@src/config';
import { JwtAuthGuard } from '@src/common/guards';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body(ValidationPipe) registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    async login(@Body(ValidationPipe) loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('refresh')
    async refreshToken(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto);
    }

    @Post('logout')
    async logout(@Body('refreshToken') refreshToken: string) {
        return this.authService.logout(refreshToken);
    }

    @Get('oauth/url')
    getOAuthUrl(
        @Query('provider') provider: 'google' | 'discord',
        @Query('codeChallenge') codeChallenge: string,
    ) {
        if (!provider || !codeChallenge) {
            throw new Error('Provider and codeChallenge are required');
        }
        return this.authService.getOAuthUrl(provider, codeChallenge);
    }

    @Post('oauth/callback')
    async oauthCallback(
        @Body('provider') provider: 'google' | 'discord',
        @Body(ValidationPipe) callbackDto: OAuthCallbackDto,
        @Res() res: Response,
    ) {
        try {
            const result = await this.authService.handleOAuthCallback(provider, callbackDto);

            // Return the tokens to the frontend
            res.status(HttpStatus.OK).json(result);
        } catch {
            // Redirect to frontend error page
            const errorUrl = `${OAUTH_CONFIG.frontend.baseUrl}${OAUTH_CONFIG.frontend.errorRedirect}`;
            res.redirect(errorUrl);
        }
    }

    // Protected route example
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getCurrentUser(@Request() req: any) {
        // req.user is set by the JwtAuthGuard and contains { id: number, role: string }
        return this.authService.getCurrentUser(req.user.id as number);
    }

    @Get('oauth/google')
    googleOAuth(@Res() res: Response) {
        // This endpoint can be used for direct OAuth flow if needed
        // For PKCE flow, frontend should use /oauth/url endpoint instead
        res.status(HttpStatus.BAD_REQUEST).json({
            message: 'Use /oauth/url endpoint with PKCE flow',
        });
    }

    @Get('oauth/discord')
    discordOAuth(@Res() res: Response) {
        // This endpoint can be used for direct OAuth flow if needed
        // For PKCE flow, frontend should use /oauth/url endpoint instead
        res.status(HttpStatus.BAD_REQUEST).json({
            message: 'Use /oauth/url endpoint with PKCE flow',
        });
    }
}
