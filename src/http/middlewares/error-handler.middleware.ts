import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import { AppError } from "../../helpers";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleError(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof AppError) {
        console.error({ body: req.body, error: { ...err.toJSON, stack: err.stack } });
        return res.status(err.httpCode).json(err.toJSON());
    }
    console.error({ body: req.body, error: { message: err.message, stack: err.stack } });
    return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Erro inesperado no servidor.", error: err.message });
}
