import { AsyncLocalStorage } from "async_hooks";

import { Logger } from "./logger";

type ExecutionContextData = {
    logger: Logger;
    requestId?: string;
};

const store = new AsyncLocalStorage<ExecutionContextData>();

export const executionContext = {
    run<T>(data: ExecutionContextData, fn: () => T) {
        return store.run(data, fn);
    },
    getLogger() {
        return store.getStore()?.logger;
    },
};
