import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class ErrorResFilter<T> implements ExceptionFilter {
    catch(exception: T, host: ArgumentsHost) {}
}
