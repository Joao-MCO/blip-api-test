import { EdgeController, StatusCodes } from "../../_framework/core";
import { closeSession, openSession } from "../../services/sessions.service";

const webhookController = new EdgeController("/session");

webhookController.register({
    method: "post",
    path: "/open",
    handler: async ({ req, res }) => {
        const response = await openSession(req.body);
        return res.status(StatusCodes.CREATED).send(response);
    },
});

webhookController.register({
    method: "post",
    path: "/close",
    handler: async ({ req, res }) => {
        const { session } = req.body;
        await closeSession(session);
        return res.status(StatusCodes.NO_CONTENT).send();
    },
});

export default webhookController;
