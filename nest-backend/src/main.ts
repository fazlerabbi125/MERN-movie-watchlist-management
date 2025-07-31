import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
// import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CustomExceptionFilter } from './common/custom-exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // app.use(cookieParser());
    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? true,
        // credentials: true,
    });
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            validationError: {
                target: false,
            },
            exceptionFactory(errors) {
                const result: Record<string, string> = {};
                errors.forEach((error) => {
                    result[error.property] = Object.values(error.constraints || {})?.[0];
                });
                return new UnprocessableEntityException({
                    message: 'Validation error found',
                    errors: result,
                });
            },
        }),
    );
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new CustomExceptionFilter());

    const config = new DocumentBuilder()
        .setTitle('Subscription Billing Nest API')
        .setDescription('Subscription Billing API documentation')
        .setVersion('1.0')
        .addBearerAuth() // Other Auth types are also available
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    await app.listen(process.env.APP_PORT ?? 3000);
}
bootstrap();
