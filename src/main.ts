import { HttpServer } from "./_framework/core";
import { autoLoadControllers } from "./_framework/helpers";
import * as middlewares from "./http/middlewares";
import { ConsoleLogger } from "./logging";

export async function bootstrap() {
    const httpServer = new HttpServer({ db: {}, baseUrl: "/api" });
    httpServer.setMiddlewares(
        { position: "before", middleware: middlewares.setupLogging(new ConsoleLogger()) },
        { position: "before", middleware: middlewares.basicAuth },
        { position: "after", middleware: middlewares.notFoundRoute },
        { position: "after", middleware: middlewares.handleError },
    );
    const controllers = await autoLoadControllers();
    httpServer.register(...controllers);
    return httpServer;
}
