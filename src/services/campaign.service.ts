import moment from "moment";

import { mongoDb } from "../database";
import { Campaign } from "../models";
import { ProviderFactory } from "../providers";

export type CampaignCreateInput = Pick<
    Campaign,
    "audience" | "campaignType" | "flowId" | "masterState" | "name" | "template" | "tags" | "messageParams" | "stateId"
> &
    Partial<Pick<Campaign, "sendDate">>;

export async function createCampaign(input: CampaignCreateInput) {
    const router = ProviderFactory.blipProvider();
    const createdAt = moment().toDate();
    const campaignCollection = mongoDb.getCampaignCollection();
    const campaign: Campaign = {
        ...input,
        createdAt,
        status: "processing",
        sendDate: input.sendDate ?? createdAt,
    };
    const response = await router.createBlipCampaign(campaign);
    campaign.status = response.status;
    if (response.reason) campaign.details = response.reason;
    if (response.id !== undefined) campaign.blipId = response.id;
    const savedCampaign = campaignCollection.insertOne(campaign);
    return savedCampaign;
}

export async function sendCampaign() {
    const filter: Record<string, unknown> = { status: "processing" };
    const campaignCollection = mongoDb.getCampaignCollection();
    const campaigns = await campaignCollection.find(filter).toArray();
    const router = ProviderFactory.blipProvider();
    const now = new Date();
    await Promise.all(
        campaigns.map(async (campaing: Campaign) => {
            try {
                await router.dispatchBlipCampaign(campaing);
                await campaignCollection.updateOne(
                    { _id: campaing._id },
                    {
                        $set: {
                            status: "sent",
                            sentAt: now,
                        },
                    },
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                await campaignCollection.updateOne(
                    { _id: campaing._id },
                    {
                        $set: {
                            status: "error",
                            sentAt: now,
                            details: { error: { message: error.message, stack: error.stack } },
                        },
                    },
                );
            }
        }),
    );
}
