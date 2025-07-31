export class SuccessResponse<T = any> {
    readonly success = true;
    readonly message: string;
    readonly result: T;

    constructor({ message, result }: Omit<SuccessResponse, 'success'>) {
        this.message = message;
        this.result = result;
    }
}

export class ErrorResponse {
    readonly success = false;
    readonly message: string;
    // readonly path?: string;
    errors?: Record<string, any>;

    constructor({ message, errors }: Omit<ErrorResponse, 'success'>) {
        this.message = message;
        this.errors = errors;
        // this.path = path;
    }
}
