/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from "../_framework/logging";

export class ConsoleLogger extends Logger {
    debug(message: string, context?: any): void {
        console.log("[DEBUG]", message, context || undefined);
    }

    info(msg: string, context?: any) {
        console.log("[INFO]", msg, context || undefined);
    }

    notice(message: string, context?: any): void {
        console.log("[NOTICE]", message, context || undefined);
    }

    warning(message: string, context?: any): void {
        console.log("[WARNING]", message, context || undefined);
    }

    error(msg: string, context?: any) {
        console.error("[ERROR]", msg, context || undefined);
    }
}
