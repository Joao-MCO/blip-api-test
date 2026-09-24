import { EdgeController, StatusCodes } from "../../_framework/core";
import { startFlows } from "../../services/flows.service";

const controller = new EdgeController("/flows");

controller.register({
    method: "post",
    path: "/",
    handler: async ({ req, res }) => {
        const { testing = false } = req.headers;
        const { environment = "prod" } = req.params;
        const response = await startFlows(req.body, environment, !!testing);
        return res.status(StatusCodes.OK).send(response);
    },
});
controller.register({
    method: "post",
    path: "/:environment",
    handler: async ({ req, res }) => {
        const { testing = false } = req.headers;
        const { environment = "prod" } = req.params;
        const response = await startFlows(req.body, environment, !!testing);
        return res.status(StatusCodes.OK).send(response);
    },
});

export default controller;
