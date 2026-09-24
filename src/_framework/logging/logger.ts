/* eslint-disable @typescript-eslint/no-explicit-any */
export const LOG_LEVELS_VALUES = {
    debug: 40,
    info: 30,
    notice: 20,
    warning: 10,
    error: 0,
} as const;

export type LogLevels = keyof typeof LOG_LEVELS_VALUES;

export abstract class Logger {
    constructor(private level: LogLevels = "warning") {}

    getLevel() {
        return this.level;
    }

    setLevel(level: LogLevels) {
        this.level = level;
    }

    abstract debug(message: string, context?: any): void;
    abstract info(message: string, context?: any): void;
    abstract notice(message: string, context?: any): void;
    abstract warning(message: string, context?: any): void;
    abstract error(message: string, context?: any): void;
}
