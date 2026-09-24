import { ObjectId } from "mongodb";

type SessionStatus = "open" | "closed" | "sent";

export type FileType = {
    name: string;
    type: string;
    url: string;
    size?: number;
};

export type Session = {
    _id?: ObjectId;
    createdAt: Date;
    openedAt: Date;
    closedAt?: Date;
    identity: string;
    messages: string[];
    files: FileType[];
    status: SessionStatus;
    delivery?: {
        date: Date;
        status: string;
        error?: {
            code: number;
            message: string;
        };
    };
};
