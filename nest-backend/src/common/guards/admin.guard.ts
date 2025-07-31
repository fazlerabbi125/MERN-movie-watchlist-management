import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UserRoles } from '../constants';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor() {}

    canActivate(context: ExecutionContext): boolean {
        const request: Request = context.switchToHttp().getRequest();
        if (request.user?.role !== UserRoles.ADMIN) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }
        return true;
    }
}
