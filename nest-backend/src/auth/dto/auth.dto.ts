import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;
}

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsOptional()
    first_name?: string;

    @IsString()
    @IsOptional()
    last_name?: string;
}

export class OAuthCallbackDto {
    @IsString()
    code: string;

    @IsString()
    state: string;

    @IsString()
    codeVerifier: string;
}

export class RefreshTokenDto {
    @IsString()
    refreshToken: string;
}

export class AuthResponseDto {
    access_token: string;
    refresh_token: string;
    user: Partial<any>; // Will be typed properly in the service
}
