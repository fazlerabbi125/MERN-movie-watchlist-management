import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@src/auth/auth.module';
import { GenreModule } from '@src/genre/genre.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
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
        AuthModule,
        GenreModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
