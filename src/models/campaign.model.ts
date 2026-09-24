import { ObjectId } from "mongodb";

export type AudienceStatus = "processing" | "success" | "failure" | "sent" | "error";

export type Audience = {
    recipient: string;
    messageParams?: Record<string, string>;
    contextVariables?: Record<string, string>;
};

export type Campaign = {
    _id?: ObjectId;
    blipId?: string;
    createdAt: Date;
    status: AudienceStatus;
    name: string;
    sendDate: Date;
    template: string;
    audience: Audience[];
    sentAt?: Date;
    flowId?: string;
    stateId?: string;
    masterState?: string;
    campaignType: "Individual" | "Batch";
    messageParams?: string[];
    tags?: string[];
    details?: Record<string, unknown>;
};
