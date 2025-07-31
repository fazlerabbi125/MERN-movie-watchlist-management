import { type ExceptionFilter, Catch, type ArgumentsHost, HttpException } from '@nestjs/common';
import type { Response } from 'express';
// import { HttpExceptionBody } from '@nestjs/common';
import { ErrorResponse } from './common-responses';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        // const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        response.status(status).json(
            new ErrorResponse({
                message: exception.message,
                ...(typeof exception.getResponse() !== 'string'
                    ? (exception.getResponse() as Omit<ErrorResponse, 'success'>)
                    : undefined),
                // path: request.url,
            }),
        );
    }
}
