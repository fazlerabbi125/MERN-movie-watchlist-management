import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());
    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? true,
        credentials: true,
    });
    app.useGlobalPipes(
        new ValidationPipe({
            // transform: true,
            errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            whitelist: true,
        }),
    );
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
