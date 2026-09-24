/* eslint-disable no-restricted-syntax */
import { isAxiosError } from "axios";
import moment from "moment";
import { AnyBulkWriteOperation } from "mongodb";
import pLimit from "p-limit";

import { mongoDb } from "../database";
import { Identity, Message, MessageDeliveryInfo } from "../models";
import { ProviderFactory } from "../providers";

export type CreateMessageInput = Pick<Message, "namespace" | "template" | "components" | "metadata" | "_extras"> &
    Partial<Pick<Message, "sendDate">> & {
        to: Identity;
    };

export async function createMessages(...input: CreateMessageInput[]) {
    if (!input.length) return [];
    const createdAt = moment().toDate();
    const messages = input.map<Message>((i) => ({
        ...i,
        to: i.to.getValue(),
        sendDate: i.sendDate ?? createdAt,
        createdAt,
        status: "pending",
    }));
    const messagesCollection = mongoDb.getMessageCollection();
    const { insertedIds } = await messagesCollection.insertMany(messages);
    const savedMessages: Message[] = [];
    for (let index = 0; index < messages.length; index += 1) {
        savedMessages.push({ _id: insertedIds[index], ...messages[index] });
    }
    return savedMessages;
}

export async function sendActiveMessages() {
    const messagesCollection = mongoDb.getMessageCollection();
    const blip = ProviderFactory.blipProvider();
    const filter: Record<string, unknown> = { status: "pending" };
    const messages = await messagesCollection.find(filter).toArray();
    const now = new Date();
    await Promise.all(
        messages.map(async (message) => {
            try {
                const identity = new Identity(message.to);
                if (message.metadata) await blip.mergeContact({ ...message.metadata, identity });
                await blip.sendActiveMessage(message);
                await messagesCollection.updateOne(
                    { _id: message._id },
                    {
                        $set: {
                            status: "sent",
                            sentAt: now,
                            delivery: {
                                deliveryStatus: "accepted",
                                updatedAt: now,
                            },
                        },
                    }
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                if (isAxiosError(error)) {
                    await messagesCollection.updateOne(
                        { _id: message._id },
                        {
                            $set: {
                                status: "error",
                                sentAt: now,
                                details: { error: error.response?.data },
                            },
                        }
                    );
                    return;
                }

                await messagesCollection.updateOne(
                    { _id: message._id },
                    {
                        $set: {
                            status: "error",
                            sentAt: now,
                            details: { error: { message: error.message, stack: error.stack } },
                        },
                    }
                );
            }
        })
    );
}

export async function syncActiveSentMessages() {
    const messagesCollection = mongoDb.getMessageCollection();
    const filter: Record<string, unknown> = { "delivery.deliveryStatus": "accepted", status: "sent" };
    const cursor = messagesCollection.aggregate<{ to: string; messages: Message[] }>([
        { $match: filter },
        { $sort: { sentAt: 1 } },
        {
            $group: {
                _id: "$to",
                to: { $first: "$to" },
                messages: { $push: "$$ROOT" },
            },
        },
        {
            $project: {
                _id: 0,
                to: 1,
                messages: 1,
            },
        },
    ]);
    const blip = ProviderFactory.blipProvider();
    const limit = pLimit(5);
    const bulkOps: AnyBulkWriteOperation<Message>[] = [];
    for await (const { to, messages } of cursor) {
        await limit(async () => {
            const threads = await blip.getThreadsByIdentity(new Identity(to), messages[0].sentAt as Date);
            const threadMap = new Map(threads.map((t) => [t.id, t]));
            for (const m of messages) {
                const thread = threadMap.get(m._id?.toString() as string);
                const delivery: MessageDeliveryInfo = thread
                    ? thread.status === "failed"
                        ? {
                              deliveryStatus: "failed",
                              updatedAt: new Date(),
                              reasonFailure: thread.reason,
                          }
                        : {
                              deliveryStatus: thread.status,
                              updatedAt: new Date(),
                          }
                    : {
                          deliveryStatus: "notFound",
                          updatedAt: new Date(),
                      };
                bulkOps.push({
                    updateOne: {
                        filter: { _id: m._id },
                        update: { $set: { delivery } },
                    },
                });
            }
        });
        if (bulkOps.length >= 500) {
            await messagesCollection.bulkWrite(bulkOps, { ordered: false });
            bulkOps.length = 0;
        }
    }
    if (bulkOps.length) await messagesCollection.bulkWrite(bulkOps, { ordered: false });
}
