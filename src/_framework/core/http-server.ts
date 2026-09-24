/* eslint-disable @typescript-eslint/no-explicit-any */
import cors from "cors";
import express, { RequestHandler } from "express";
import helmet from "helmet";

import { z } from "../zod";
import { EdgeController } from "./edge";
import {
    EdgeHandlerContextExtras,
    HandlerContext,
    HttpServerOptions,
    MiddlewareConfig,
    RouteDefinition,
    StatusCodes,
} from "./types";

const { NODE_ENV = "development" } = process.env;

export class HttpServer<DB = any> {
    private app: express.Express;
    private db: DB;
    private authorizationMiddleware?: RequestHandler;
    private globalMiddlewares: MiddlewareConfig[] = [];

    constructor(private opt: HttpServerOptions<DB>, protected extras?: EdgeHandlerContextExtras) {
        this.db = opt.db;
        this.app = express();
        this.app.use(express.json());
        this.app.use(cors(opt.corsOptions));
        this.app.use(helmet(opt.helmetOptions));
    }

    setMiddlewares(...middlewares: MiddlewareConfig[]): void {
        this.globalMiddlewares.push(...middlewares);
    }

    setAuthorizationMiddleware(middleware: RequestHandler): void {
        this.authorizationMiddleware = middleware;
    }

    register(...controllers: EdgeController[]): void {
        const allRoutes = controllers.flatMap((controller) => controller.getRoutes());
        this.globalMiddlewares
            .filter((middleware) => middleware.position === "before")
            .forEach((middleware) => this.app.use(middleware.middleware));
        allRoutes.forEach((route) => {
            const { method, middlewares } = route;
            const url = this.buildUrl(route.path);
            if (NODE_ENV !== "production") console.info(`[${method.toUpperCase()}] ${url}`);
            const pipeline: express.RequestHandler[] = [];
            if (this.authorizationMiddleware) pipeline.push(this.authorizationMiddleware);
            if (middlewares) pipeline.push(...middlewares);
            pipeline.push(this.buildHandler(route));
            this.app[method](url, ...pipeline);
        });
        this.globalMiddlewares
            .filter((middleware) => middleware.position === "after")
            .forEach((middleware) => this.app.use(middleware.middleware));
    }

    private buildUrl(...paths: string[]): string {
        let url = [this.opt.baseUrl, ...paths].join("/").replace(/\/{2,}/g, "/");
        if (url.endsWith("/")) url = url.replace(/\/+$/, "");
        return url;
    }

    private buildHandler(route: RouteDefinition): express.RequestHandler {
        const { handler, schema } = route;
        return async (req, res, next) => {
            try {
                const ctx: HandlerContext<any> = { ...this.extras, db: this.db, req, res, validatedSchema: undefined };
                if (schema) {
                    const result = (schema as z.ZodTypeAny).safeParse(req.body);
                    if (!result.success)
                        return res
                            .status(StatusCodes.UNPROCESSABLE_ENTITY)
                            .json({ message: "Erro de validação.", errors: z.treeifyError(result.error) });
                    if (result.success) ctx.validatedSchema = result.data;
                }
                return handler(ctx);
            } catch (error) {
                return next(error);
            }
        };
    }

    listen(port: number, callback?: () => void): void {
        const cb = callback || (() => console.info(`Server ready and running on port ${port} with express.`));
        this.app.listen(port, () => cb());
    }

    getServer(): express.Express {
        return this.app;
    }
}
