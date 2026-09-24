import fg from "fast-glob";
import path from "path";
import { pathToFileURL } from "url";

import { EdgeController } from "../core";

export async function autoLoadControllers(pattern = "**/*.routes.{ts,js}") {
    const rootDir = process.env.NODE_ENV !== "production" ? "src" : "build";
    const baseDir = path.resolve(process.cwd(), rootDir);
    const files = await fg(pattern, { cwd: baseDir, absolute: true });
    const controllers: EdgeController[] = [];
    await Promise.all(
        files.map(async (file) => {
            const mod = await import(pathToFileURL(file).href);
            const controller = mod?.default ?? mod;
            if (controller) controllers.push(controller.default ? controller.default : controller);
        })
    );
    return controllers;
}
