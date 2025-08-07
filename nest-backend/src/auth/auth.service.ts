import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@src/entities/user.entity';
import { RefreshToken } from '@src/entities/refreshToken.entity';
import { OAuthService, OAuthUserProfile } from './oauth.service';
import { LoginDto, RegisterDto, OAuthCallbackDto, RefreshTokenDto } from './dto/auth.dto';
import { UserRoles } from '@src/common/constants';
import { JWT_config } from '@src/config';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        private jwtService: JwtService,
        private oauthService: OAuthService,
    ) {}

    // Helper method to exclude password from user object
    private excludePassword(user: User): Partial<User> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Generate JWT tokens
    private async generateTokens(user: User) {
        const payload = { sub: user.id, email: user.email, role: user.role };

        const accessToken = this.jwtService.sign(payload, {
            secret: JWT_config.access.secret,
            expiresIn: JWT_config.access.expiresIn,
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: JWT_config.refresh.secret,
            expiresIn: JWT_config.refresh.expiresIn,
        });

        // Save refresh token to database
        await this.saveRefreshToken(user, refreshToken);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: this.excludePassword(user),
        };
    }

    // Save refresh token to database
    private async saveRefreshToken(user: User, token: string) {
        const expiresAt = new Date();
        expiresAt.setTime(expiresAt.getTime() + JWT_config.refresh.expiresIn);

        const refreshToken = this.refreshTokenRepository.create({
            token,
            user,
            expiresAt,
        });

        await this.refreshTokenRepository.save(refreshToken);
    }

    // Credential-based registration
    async register(registerDto: RegisterDto) {
        const { email, password, first_name, last_name } = registerDto;

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            first_name: first_name || '',
            last_name: last_name || '',
            role: UserRoles.MEMBER,
            emailVerified: false,
        });

        const savedUser = await this.userRepository.save(user);
        return this.generateTokens(savedUser);
    }

    // Credential-based login
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user by email
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user || !user.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateTokens(user);
    }

    // OAuth callback handler
    async handleOAuthCallback(provider: 'google' | 'discord', callbackDto: OAuthCallbackDto) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { code, state, codeVerifier } = callbackDto;

        // Exchange code for access token
        const accessToken = await this.oauthService.exchangeCodeForTokens(
            provider,
            code,
            codeVerifier,
        );

        // Get user profile from OAuth provider
        const profile = await this.oauthService.getUserProfile(provider, accessToken);

        // Find or create user
        let user = await this.findUserByProvider(provider, profile.id);

        if (!user) {
            // Check if user exists with same email but different provider
            const existingUser = await this.userRepository.findOne({
                where: { email: profile.email },
            });

            if (existingUser) {
                // Link OAuth account to existing user
                user = await this.linkOAuthAccount(existingUser, provider, profile);
            } else {
                // Create new user
                user = await this.createOAuthUser(provider, profile);
            }
        } else {
            // Update existing OAuth user with latest profile data
            user = await this.updateOAuthUser(user, profile);
        }

        return this.generateTokens(user);
    }

    // Find user by OAuth provider
    private async findUserByProvider(
        provider: 'google' | 'discord',
        providerId: string,
    ): Promise<User | null> {
        const whereCondition =
            provider === 'google' ? { googleId: providerId } : { discordId: providerId };

        return this.userRepository.findOne({ where: whereCondition });
    }

    // Create new user from OAuth profile
    private async createOAuthUser(
        provider: 'google' | 'discord',
        profile: OAuthUserProfile,
    ): Promise<User> {
        const userData: Partial<User> = {
            email: profile.email,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            avatar: profile.avatar,
            role: UserRoles.MEMBER,
            emailVerified: profile.emailVerified || false,
        };

        if (provider === 'google') {
            userData.googleId = profile.id;
        } else {
            userData.discordId = profile.id;
        }

        const user = this.userRepository.create(userData);
        return this.userRepository.save(user);
    }

    // Link OAuth account to existing user
    private async linkOAuthAccount(
        user: User,
        provider: 'google' | 'discord',
        profile: OAuthUserProfile,
    ): Promise<User> {
        if (provider === 'google') {
            user.googleId = profile.id;
        } else {
            user.discordId = profile.id;
        }

        // Update profile data if not set
        if (!user.avatar && profile.avatar) {
            user.avatar = profile.avatar;
        }
        if (!user.first_name && profile.first_name) {
            user.first_name = profile.first_name;
        }
        if (!user.last_name && profile.last_name) {
            user.last_name = profile.last_name;
        }

        return this.userRepository.save(user);
    }

    // Update existing OAuth user
    private async updateOAuthUser(user: User, profile: OAuthUserProfile): Promise<User> {
        user.avatar = profile.avatar || user.avatar;
        user.first_name = profile.first_name || user.first_name;
        user.last_name = profile.last_name || user.last_name;
        user.emailVerified = profile.emailVerified || user.emailVerified;

        return this.userRepository.save(user);
    }

    // Refresh token
    async refreshToken(refreshTokenDto: RefreshTokenDto) {
        const { refreshToken } = refreshTokenDto;

        try {
            // Verify refresh token
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const payload = this.jwtService.verify(refreshToken, {
                secret: JWT_config.refresh.secret,
            });

            // Check if token exists in database and is not expired
            const storedToken = await this.refreshTokenRepository.findOne({
                where: { token: refreshToken },
                relations: ['user'],
            });

            if (!storedToken || storedToken.expiresAt < new Date()) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(storedToken.user);

            // Remove old refresh token
            await this.refreshTokenRepository.remove(storedToken);

            return tokens;
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    // Logout (invalidate refresh token)
    async logout(refreshToken: string) {
        const storedToken = await this.refreshTokenRepository.findOne({
            where: { token: refreshToken },
        });

        if (storedToken) {
            await this.refreshTokenRepository.remove(storedToken);
        }

        return { message: 'Logged out successfully' };
    }

    // Get OAuth authorization URL
    getOAuthUrl(provider: 'google' | 'discord', codeChallenge: string) {
        const state = this.oauthService.generateState();
        const authUrl = this.oauthService.generateAuthUrl(provider, state, codeChallenge);

        return {
            authUrl,
            state,
        };
    }

    // Get current user by ID
    async getCurrentUser(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: [
                'id',
                'email',
                'first_name',
                'last_name',
                'avatar',
                'role',
                'emailVerified',
                'active',
                'createdAt',
                'updatedAt',
            ],
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return { user };
    }
}
