import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import { AppError } from "../../helpers";

class HttpRouteNotFoundError extends AppError {
    constructor(private method: string, private url: string) {
        super("A rota HTTP solicitada não está registrada.", StatusCodes.NOT_FOUND);
    }

    toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            method: this.method,
            url: this.url,
        };
    }
}

export function notFoundRoute(req: Request, res: Response, next: NextFunction) {
    const { method, url } = req;
    return next(new HttpRouteNotFoundError(method, url));
}
