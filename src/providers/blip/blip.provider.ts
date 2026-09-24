import axios from "axios";
import moment from "moment";
import { randomUUID } from "node:crypto";

import { env } from "../../config";
import { AudienceStatus, Campaign, Identity, Message } from "../../models";
import {
    BlipAccount,
    BlipContact,
    BlipContactRaw,
    BlipMergeContactInput,
    BlipResources,
    BlipThread,
} from "./blip.provider.types";

type RunCommandParams = {
    path: string;
    id?: string;
    to: string;
    method: string;
    uri?: string;
    [key: string]: unknown;
};

type CampaignResponse = {
    id: string;
    name: string;
    campaignType: string;
    status: string;
    failedReason?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlipCommandResponse<T = any> = {
    type: string;
    resource: T;
    reason?: {
        code: number;
        description: string;
    };
    method: string;
    status: string;
    id: string;
    from: string;
    to: string;
    metadata: {
        traceparent: string;
        "#command.uri": string;
    };
};

type BlipThreadResponse = {
    total: number;
    itemType: string;
    items: BlipThread[];
};

export class Blip {
    private client: axios.AxiosInstance;

    constructor(token: string) {
        this.client = axios.create({
            baseURL: `https://${env.BLIP_TENANT}.http.msging.net`,
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });
    }

    async getResource<R extends keyof BlipResources>(key: R): Promise<BlipResources[R]> {
        const { resource } = await this.runCommand<BlipResources[R]>({
            path: "commands",
            to: "postmaster@msging.net",
            method: "get",
            uri: `/resources/${key}`,
        });
        return resource;
    }

    async setResource<R extends keyof BlipResources>(key: R, value: BlipResources[R]): Promise<void> {
        await this.runCommand<void>({
            path: "commands",
            to: "postmaster@msging.net",
            method: "set",
            uri: `/resources/${key}`,
            type: "application/json",
            resource: value,
        });
    }

    async getAccount(key: string, channel: string): Promise<BlipAccount | null> {
        const { resource } = await this.runCommand<BlipAccount>({
            path: "commands",
            to: `postmaster@${channel}`,
            method: "get",
            uri: `lime://${channel}/accounts/${key}`,
        });
        if (!resource) return null;
        return resource;
    }

    async getExternalContactByPhone(
        ...phone: string[]
    ): Promise<{ id: string; bsuid: string; waId: string; lastReadDate: Date }[] | null> {
        const { resource } = await this.runCommand({
            path: "commands",
            to: `postmaster@wa.gw.msging.net`,
            method: "get",
            uri: `/external-contacts-mapping?phoneNumbers=${phone.join(",")}`,
        });
        if (!resource) return null;
        return resource.items;
    }

    async getContactByIdentity(identity: Identity): Promise<BlipContact | null> {
        const { resource } = await this.runCommand<BlipContactRaw>({
            path: "commands",
            to: "postmaster@crm.msging.net",
            method: "get",
            uri: `/contacts/${identity.getFullIdentity()}`,
        });
        if (!resource) return null;
        return {
            name: resource.name,
            lastMessageDate: moment(resource.lastMessageDate).toDate(),
            lastUpdateDate: moment(resource.lastUpdateDate).toDate(),
            identity: new Identity(resource.identity),
            email: resource.email,
            phoneNumber: resource.phoneNumber,
            extras: resource.extras,
        };
    }

    async getContact(filter: Record<string, string>): Promise<BlipContact | null> {
        const key = Object.keys(filter)[0];
        const value = filter[key];
        const { resource } = await this.runCommand<{ items: BlipContactRaw[] }>({
            path: "commands",
            to: "postmaster@crm.msging.net",
            method: "get",
            uri: `/contacts?$filter=(${key}%20eq%20'${value}')`,
        });

        if (!resource) return null;
        const data = resource.items[0];

        return {
            name: data.name,
            lastMessageDate: moment(data.lastMessageDate).toDate(),
            lastUpdateDate: moment(data.lastUpdateDate).toDate(),
            identity: new Identity(data.identity),
            email: data.email,
            phoneNumber: data.phoneNumber,
            extras: data.extras,
        };
    }

    async getTunnel(identity: Identity): Promise<Identity | null> {
        const { resource } = await this.runCommand<string>({
            path: "commands",
            to: "postmaster@tunnel.msging.net",
            method: "get",
            uri: `/tunnels/${identity.getFullIdentity()}/${env.BLIP_ATTENDANCE_NAME}@msging.net`,
        });

        if (!resource) return null;
        console.log(resource);
        return new Identity(`${resource}@tunnel.msging.net`);
    }

    async sendActiveMessage(message: Message): Promise<void> {
        await this.runCommand({
            id: message._id?.toString(),
            path: "messages",
            to: new Identity(message.to).getFullIdentity(),
            type: "application/json",
            method: "post",
            content: {
                type: "template",
                template: {
                    namespace: message.namespace,
                    name: message.template,
                    language: { code: "pt_BR", policy: "deterministic" },
                    components: [...(message.components ?? [])],
                },
            },
            metadata: message.metadata,
        });
    }

    async createBlipCampaign(
        campaign: Campaign,
    ): Promise<{ id: string; status: AudienceStatus; reason?: Record<string, unknown> }> {
        const { _id: idCampaign, status: campaignStatus, createdAt, sendDate, ...body } = campaign;
        const res = {
            campaign: {
                ...body,
                channelType: "WhatsApp",
            },
            audiences: campaign.audience,
            message: {
                messageTemplate: campaign.template,
                messageParams: campaign.messageParams,
            },
        };
        const blipId = idCampaign?.toString() ?? randomUUID();
        const { id, status, reason, resource } = await this.runCommand<CampaignResponse>({
            id: blipId,
            path: "commands",
            to: "postmaster@activecampaign.msging.net",
            method: "set",
            uri: "/campaign/full",
            type: "application/vnd.iris.activecampaign.full-campaign+json",
            resource: res,
        });
        if (!resource)
            return {
                id,
                status: status as AudienceStatus,
                reason,
            };

        return {
            id: resource.id,
            status: resource.status as AudienceStatus,
        };
    }

    async dispatchBlipCampaign(campaign: Campaign): Promise<void> {
        await this.runCommand({
            id: randomUUID(),
            path: "commands",
            to: "postmaster@activecampaign.msging.net",
            method: "set",
            uri: "/dispatch/v2",
            type: "application/vnd.iris.activecampaign.campaign+json",
            resource: {
                id: campaign.blipId,
            },
        });
    }

    async getThreadsByIdentity(identity: Identity, storageDate: Date): Promise<BlipThread[]> {
        const threads = await this.runCommand<BlipThreadResponse>({
            path: "commands",
            to: "postmaster@msging.net",
            method: "get",
            uri: `/threads/${identity.getFullIdentity()}?refreshExpiredMedia=true&storageDate=${moment(storageDate).format(
                "YYYY-MM-DDTHH:mm",
            )}&$take=100`,
        });
        return threads.resource.items;
    }

    async redirectToBot(identity: Identity, botId: string) {
        await this.runCommand({
            path: "commands",
            to: "postmaster@msging.net",
            method: "set",
            uri: `/contexts/${identity.getFullIdentity()}/Master-State`,
            type: "text/plain",
            resource: botId.indexOf("@msging.net") === -1 ? `${botId}@msging.net` : botId,
        });
    }

    async redirectToBlock(identity: Identity, flowId: string, stateId: string) {
        await this.runCommand({
            path: "commands",
            to: "postmaster@msging.net",
            method: "set",
            uri: `/contexts/${identity.getFullIdentity()}/stateid@${flowId}`,
            type: "text/plain",
            resource: stateId,
        });
    }

    async resetUserState(identity: Identity, flowIdentifier: string) {
        await this.runCommand({
            path: "commands",
            to: "postmaster@msging.net",
            method: "delete",
            uri: `/contexts/${identity.getFullIdentity()}/stateid@${flowIdentifier}`,
        });
    }

    async mergeContact({ identity, ...newData }: BlipMergeContactInput): Promise<void> {
        await this.runCommand({
            path: "commands",
            method: "merge",
            to: "postmaster@crm.msging.net",
            uri: "/contacts",
            type: "application/vnd.lime.contact+json",
            resource: { identity: identity.getFullIdentity(), ...newData },
        });
    }

    async getAllThreads(identity: Identity, date: Date) {
        const threads: BlipThread[] = [];

        let lastMessageDate = date;
        let newThreads = await this.getThreadsByIdentity(identity, new Date(lastMessageDate));
        while (newThreads.length > 0) {
            threads.push(...newThreads);
            const lastThread = newThreads.at(-1);
            if (!lastThread) {
                break;
            }
            lastMessageDate = new Date(new Date(lastThread.date).getTime() + 1);
            // eslint-disable-next-line no-await-in-loop
            newThreads = await this.getThreadsByIdentity(identity, new Date(lastMessageDate));
        }

        return threads;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async runCommand<T = any>(params: RunCommandParams): Promise<BlipCommandResponse<T>> {
        const { path, id = randomUUID(), to, method, uri, ...rest } = params;
        const url = `${path[0] === "/" ? "" : "/"}${path}`;
        const body = { id, to, method, uri, ...rest };
        if (env.LOG) {
            console.log(`[URL] ${url}`);
            console.log(`[BODY] ${JSON.stringify(body, null, 2)}`);
        }
        const response = await this.client.post<BlipCommandResponse<T>>(url, body);
        if (env.LOG) {
            console.log(`[RESPONSE] ${JSON.stringify(response.data, null, 2)}`);
        }
        const { data } = response;
        return data;
    }
}
