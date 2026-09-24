import moment from "moment";
import { ObjectId } from "mongodb";

import { mongoDb } from "../database";
import { IdentityError } from "../helpers";
import { Identity, Session } from "../models";
import { ProviderFactory } from "../providers";

export type CreateSessionType = Pick<Session, "openedAt" | "identity">;

export async function closeSession(input: string): Promise<void> {
    const now = moment();
    const sessionId = new ObjectId(input);
    const sessions = mongoDb.getSessionCollection();

    await sessions.findOneAndUpdate(
        { _id: sessionId },
        {
            $set: {
                closedAt: now.toDate(),
                status: "closed",
            },
        },
        {
            upsert: true,
        }
    );
}

export async function openSession(sessionInput: CreateSessionType): Promise<ObjectId> {
    const now = moment();
    const sessions = mongoDb.getSessionCollection();

    const blip = ProviderFactory.blipProvider();

    const rawIdentity = new Identity(sessionInput.identity);

    const account = await blip.getAccount(`${rawIdentity.getValue()}`, "wa.gw.msging.net");
    if (!account)
        throw new IdentityError("Não foi possível encontrar uma account para o número.", `${rawIdentity.getValue()}`);

    const identity = new Identity(account.identity);

    const openedSessions = await sessions
        .find({
            identity: identity.getFullIdentity(),
            status: "open",
        })
        .toArray();

    if (openSession.length > 0)
        await Promise.all(
            openedSessions.map(async (session: Session) => {
                if (session._id) await closeSession(session._id?.toString());
            })
        );

    const session: Session = {
        identity: identity.getFullIdentity(),
        createdAt: now.toDate(),
        openedAt: new Date(sessionInput.openedAt),
        messages: [],
        files: [],
        status: "open",
    };

    const { insertedId } = await sessions.insertOne(session);
    return insertedId;
}
