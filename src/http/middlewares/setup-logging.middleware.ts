import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

import { executionContext, Logger } from "../../_framework/logging";

export function setupLogging(logger: Logger) {
    return (req: Request, res: Response, next: NextFunction) => {
        executionContext.run({ logger, requestId: randomUUID() }, () => next());
    };
}
