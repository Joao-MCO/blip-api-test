/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestHandler } from "express";

// import type { PrismaClient } from "@prisma/client";
import { z } from "../zod";
import { RouteDefinition } from "./types";

export class EdgeController<DB = any> {
    private routes: RouteDefinition<any, DB>[] = [];

    constructor(private baseUrl?: string, private auth?: boolean, private middlewares?: RequestHandler[]) {}

    register<Schema extends z.ZodTypeAny | undefined = undefined>({
        path,
        auth,
        middlewares: routeMiddlewares,
        ...opts
    }: RouteDefinition<Schema, DB>) {
        const withAuth = typeof auth === "boolean" ? auth : !!this.auth;
        const mergedMiddlewares: RequestHandler[] = [];
        if (this.middlewares) mergedMiddlewares.push(...this.middlewares);
        if (routeMiddlewares) mergedMiddlewares.push(...routeMiddlewares);
        this.routes.push({
            path: `${this.baseUrl ?? ""}${path}`,
            auth: withAuth,
            middlewares: mergedMiddlewares,
            ...opts,
        });
    }

    getRoutes(): RouteDefinition[] {
        return [...this.routes];
    }
}
