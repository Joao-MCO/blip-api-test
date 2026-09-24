import { IncomingMessage, ServerResponse } from "http";

import { bootstrap } from "../src/main";

const serverPromise = bootstrap();

export default async (req: IncomingMessage, res: ServerResponse) => {
    const server = (await serverPromise).getServer();
    return server(req, res);
};
