import { env } from "./config";
import { bootstrap } from "./main";

(async () => {
    const httpServer = await bootstrap();
    httpServer.listen(env.APP_PORT);
})();
