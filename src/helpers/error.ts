/* eslint-disable max-classes-per-file */
import { StatusCodes } from "http-status-codes";

export class AppError extends Error {
    constructor(message: string, readonly httpCode = 500) {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;
        this.message = message;
        Error.captureStackTrace(this);
    }

    toJSON(): Record<string, unknown> {
        const { message } = this;
        return { message };
    }
}

export class IdentityError extends AppError {
    constructor(message: string, private identity: string) {
        super(message, StatusCodes.BAD_REQUEST);
    }

    toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            identity: this.identity,
        };
    }
}
