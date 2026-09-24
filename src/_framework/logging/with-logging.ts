import { executionContext } from "./execution-context";
import { LOG_LEVELS_VALUES, LogLevels } from "./logger";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function withLogging<T extends (...args: any[]) => any>(
    fn: T,
    options: { name?: string; minLevel?: LogLevels } = {}
): T {
    const name = options.name || fn.name || "anonymous";
    const level = options.minLevel ?? "info";

    // eslint-disable-next-line func-names
    return function (...args: Parameters<T>) {
        const logger = executionContext.getLogger();
        if (!logger) throw new Error("No logger in execution context");

        const current = LOG_LEVELS_VALUES[logger.getLevel()];
        const required = LOG_LEVELS_VALUES[level];

        const shouldLog = current >= required;

        if (shouldLog) logger.info(`[${name}] iniciado`, { args });

        const start = Date.now();
        try {
            const result = fn(...args);

            // 🔹 Async
            if (result instanceof Promise) {
                return result
                    .then((value) => {
                        if (shouldLog) logger[level](`[${name}] sucesso (${Date.now() - start}ms)`, { result: value });
                        return value;
                    })
                    .catch((error) => {
                        logger.error(`[${name}] erro`, { error });
                        throw error;
                    }) as ReturnType<T>;
            }

            // 🔹 Sync
            if (shouldLog) logger[level](`[${name}] sucesso (${Date.now() - start}ms)`, { result });

            return result;
        } catch (error) {
            logger.error(`[${name}] erro`, { error });
            throw error;
        }
    } as T;
}
