/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-interface */
import cors from "cors";
import type { Request, Response, RequestHandler, ErrorRequestHandler } from "express";
import { HelmetOptions } from "helmet";

import { z } from "../zod";

export * from "http-status-codes";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type MutationHttpMethod = Exclude<HttpMethod, "get">;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface EdgeHandlerContextExtras {}

export type MiddlewareConfig = {
    position: "before" | "after";
    middleware: RequestHandler | ErrorRequestHandler;
};

export type HandlerContext<
    Schema extends z.ZodTypeAny | undefined = undefined,
    DB = any,
    Extras = Record<string, unknown>
> = {
    db: DB;
    req: Request;
    res: Response;
    validatedSchema: Schema extends z.ZodTypeAny ? z.infer<Schema> : undefined;
} & Extras;

export type Handler<Schema extends z.ZodTypeAny | undefined = undefined, DB = any> = (
    args: HandlerContext<Schema, DB>
) => Promise<Response | void>;

export type RouteDefinition<Schema extends z.ZodTypeAny | undefined = undefined, DB = any> = {
    path: string;
    method: HttpMethod;
    auth?: boolean;
    middlewares?: RequestHandler[];
    schema?: Schema;
    handler: Handler<Schema, DB>;
};

export type QueryRouteDefinition<Schema extends z.ZodTypeAny | undefined = undefined, DB = any> = Omit<
    RouteDefinition<Schema, DB>,
    "method"
>;

export type MutationRouteDefinition<Schema extends z.ZodTypeAny | undefined = undefined, DB = any> = Omit<
    RouteDefinition<Schema, DB>,
    "method"
> & {
    method?: MutationHttpMethod;
};

export type ControllerDefinition = {
    path: string;
    auth?: boolean;
    middlewares?: RequestHandler[];
    actions: Record<string, RouteDefinition<any>>;
};

export type HttpServerOptions<DB = any> = {
    db: DB;
    baseUrl?: string;
    corsOptions?: cors.CorsOptions;
    helmetOptions?: HelmetOptions;
};
