import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard, AdminGuard } from '@src/common/guards';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Get('list')
    getAllUsers() {
        // Only admins can view all users
        return this.usersService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getUserProfile(@Request() req: any) {
        // Any authenticated user can view their own profile
        return this.usersService.findOne(req.user.id);
    }
}
