import { EdgeController } from "../../_framework/core";

const controller = new EdgeController("/");

controller.register({
    method: "get",
    path: "/ping",
    handler: async ({ res }) => {
        return res.send("pong");
    },
});

export default controller;
