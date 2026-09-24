import { Identity } from "../../models";

export type BlipButtons = {
    buttonType: string;
    path?: string;
};

export type BlipWebhookConfig = {
    _id: string;
    id: string;
    template: string;
    headerVariables: string;
    headerPath?: string;
    bodyVariables?: string[];
    buttons?: BlipButtons[];
    triggerDays: string;
    queue: string;
    doc: string;
    variables?: string[];
    listId?: string;
};

export type BlipResources = {
    webhookConfig: { items: BlipWebhookConfig[] };
};

export type BlipContactRaw = {
    name: string;
    lastMessageDate: string;
    lastUpdateDate: string;
    identity: string;
    email: string;
    phoneNumber: string;
    extras?: Record<string, unknown>;
};

export type BlipContact = {
    name: string;
    lastMessageDate: Date;
    lastUpdateDate: Date;
    identity: Identity;
    email: string;
    phoneNumber: string;
    extras?: Record<string, unknown>;
};

export type BlipAccount = {
    alternativeAccount: string;
    identity: string;
    phoneNumber?: string;
    source: string;
    whatsAppBsuid: string;
    whatsAppWaId: string;
};

export type BlipMergeContactInput = Pick<BlipContact, "identity"> & Partial<Omit<BlipContact, "identity">>;

export type BlipThread = {
    id: string;
    direction: string;
    type: string;
    content: Record<string, unknown>;
    date: Date;
    status: "accepted" | "dispatched" | "received" | "consumed" | "failed";
    metadata: Record<string, unknown>;
    reason?: Record<string, unknown>;
};
