import { EdgeController, StatusCodes } from "../../_framework/core";
import { sendActiveMessages, syncActiveSentMessages } from "../../services/messages.service";

const controller = new EdgeController("/cron");

controller.register({
    method: "get",
    path: "/send-messages",
    handler: async ({ res }) => {
        await sendActiveMessages();
        return res.status(StatusCodes.NO_CONTENT).send();
    },
});

controller.register({
    method: "get",
    path: "/sync-sent-messages",
    handler: async ({ res }) => {
        await syncActiveSentMessages();
        return res.status(StatusCodes.NO_CONTENT).send();
    },
});

export default controller;
