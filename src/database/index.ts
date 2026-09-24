import { MongoClient } from "mongodb";

import { env } from "../config";
import { Campaign, Message, Session } from "../models";

class MongoDbDatabase {
    private client: MongoClient;

    constructor(url: string, private dbName: string) {
        this.client = new MongoClient(url);
    }

    async connect() {
        await this.client.connect();
    }

    getMessageCollection() {
        const db = this.client.db(this.dbName);
        return db.collection<Message>("messages");
    }

    getCampaignCollection() {
        const db = this.client.db(this.dbName);
        return db.collection<Campaign>("campaigns");
    }

    getSessionCollection() {
        const db = this.client.db(this.dbName);
        return db.collection<Session>("sessions");
    }
}

export const mongoDb = new MongoDbDatabase(env.MONGODB_URL, env.MONGODB_DATABASE);
