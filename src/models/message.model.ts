import { ObjectId } from "mongodb";

import { getValueByPath } from "../helpers";
import { BlipButtons } from "../providers/blip";

type MessageStatus = "pending" | "sent" | "error" | "canceled";

type MessageDeliveryStatus = "notFound" | "accepted" | "dispatched" | "received" | "consumed" | "failed";

type MessageComponent = { type: string; parameters: any; sub_type?: string; index?: number };
type BodyComponent = { type: "text"; text: string };

export const typesDict: Record<string, string> = {
    Imagem: "image",
    Vídeo: "video",
    Documento: "document",
    Localização: "location",
};

export type MessageDeliveryInfo = {
    deliveryStatus: MessageDeliveryStatus;
    updatedAt: Date;
    reasonFailure?: Record<string, unknown>;
};

export type Message = {
    _id?: ObjectId;
    createdAt: Date;
    to: string;
    namespace: string;
    template: string;
    components: MessageComponent[];
    status: MessageStatus;
    sendDate: Date;
    sentAt?: Date;
    details?: Record<string, unknown>;
    delivery?: MessageDeliveryInfo;
    metadata?: Record<string, unknown>;
    _extras?: Record<string, unknown>;
};

function buttonFormat(type: string, data: any) {
    if (type === "quick_reply") {
        return {
            type: "payload",
            payload: `${data}`,
        };
    }
    if (type === "url" || type === "phone_number" || type === "flow") {
        return {
            type: "text",
            text: `${data}`,
        };
    }

    return null;
}

export function formatTemplateComponents(data: any, body?: string[], buttons?: BlipButtons[]): MessageComponent[] {
    const components: MessageComponent[] = [];
    const bodyParameters: BodyComponent[] = [];

    if (body !== undefined && body.length > 0) {
        body.forEach((variable) => {
            const value = getValueByPath(data, variable);

            if (value !== undefined && value !== null) {
                bodyParameters.push({
                    type: "text",
                    text: `${value}`,
                });
            }
        });

        if (bodyParameters.length > 0) {
            components.push({
                type: "body",
                parameters: bodyParameters,
            });
        }
    }

    let index = 0;

    if (buttons !== undefined && buttons.length > 0) {
        buttons.forEach((button) => {
            if (button !== undefined && button.path && button.buttonType) {
                const { path, buttonType: type } = button;

                const buttonData = getValueByPath(data, path);

                const parameter = buttonFormat(type, buttonData);

                if (!parameter) {
                    return;
                }

                const component: MessageComponent = {
                    type: "button",
                    sub_type: type,
                    index,
                    parameters: [parameter],
                };

                index += 1;
                components.push(component);
            }
        });
    }

    return components;
}

export function formatTemplateMedia(type: string, url: string, data?: Record<string, any>): MessageComponent[] {
    const media =
        type === "location"
            ? data
            : {
                  link: url,
              };

    if (type === "document") {
        return [
            {
                type: "header",
                parameters: [
                    {
                        type,
                        [type]: {
                            ...media,
                            filename: data?.filename || "doc.pdf",
                        },
                    },
                ],
            },
        ];
    }

    return [
        {
            type: "header",
            parameters: [
                {
                    type,
                    [type]: media,
                },
            ],
        },
    ];
}
