import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@src/entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    async findAll() {
        return this.userRepository.find({
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
    }

    async findOne(id: number) {
        return this.userRepository.findOne({
            where: { id },
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
    }
}
