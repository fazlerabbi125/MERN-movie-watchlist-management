import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './refreshToken.entity';
import { UserRoles } from '@src/common/constants';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ unique: true })
    email: string;
    @Column({ nullable: true })
    password: string;
    @Column()
    first_name: string;
    @Column()
    last_name: string;
    @Column({ nullable: true })
    avatar: string;
    @Column({
        type: 'enum',
        enum: UserRoles,
    })
    role: UserRoles;
    @OneToMany(() => RefreshToken, (rt) => rt.user)
    refreshTokens: RefreshToken[];
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
    @Column({ default: false })
    emailVerified: boolean;
    @Column({ default: false })
    active: boolean;
    @Column({ nullable: true })
    googleId: string;
    @Column({ nullable: true })
    discordId: string;
}
