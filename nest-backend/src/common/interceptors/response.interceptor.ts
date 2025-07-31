import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '../common-responses';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
    constructor(
        private readonly message: string,
        private readonly dataDto?: ClassConstructor<T>,
    ) {}

    intercept(_context: ExecutionContext, next: CallHandler) {
        return next.handle().pipe(
            map((data) => {
                const transformedData = this.dataDto ? plainToInstance(this.dataDto, data) : data;
                return new SuccessResponse({ message: this.message, result: transformedData });
            }),
        );
    }
}
