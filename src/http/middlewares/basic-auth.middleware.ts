import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import { env } from "../../config";
import { AppError } from "../../helpers";

export function basicAuth(req: Request, res: Response, next: NextFunction) {
    const { path, headers } = req;
    if (req.path.startsWith("/api/cron")) return next();
    if (!path.indexOf("/api/flows") || path === "/api/ping") return next();
    if (!headers.authorization) return next(new AppError("Authorization token não encontrado.", StatusCodes.UNAUTHORIZED));
    const [, token] = headers.authorization.split(" ");
    if (token !== env.AUTH_TOKEN) return next(new AppError("Authorization token inválido.", StatusCodes.UNAUTHORIZED));
    return next();
}
