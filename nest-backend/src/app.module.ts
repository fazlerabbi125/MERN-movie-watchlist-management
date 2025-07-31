import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@src/auth/auth.module';
import { GenreModule } from '@src/genre/genre.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        JwtModule.register({
            global: true,
        }),
        ServeStaticModule.forRoot(
            {
                rootPath: path.join(__dirname, '..', 'media'),
                serveRoot: '/media',
            },
            {
                rootPath: path.join(__dirname, '..', 'assets'),
                serveRoot: '/static',
            },
        ),
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: process.env.DB_HOST ?? 'localhost',
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            entities: [],
            synchronize: process.env.NODE_ENV !== 'production',
        }),
        AuthModule,
        GenreModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
