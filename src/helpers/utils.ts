import moment from "moment";

import { FileType } from "../models";
import { BlipThread } from "../providers/blip";

const getAuthorType = (thread: BlipThread): string => {
    if (thread.id.startsWith("fwd")) return "atendente_humano";
    if (thread.direction === "received") return "cliente";
    return "bot";
};

export async function attendanceSummary(threads: BlipThread[]): Promise<{
    messages: string[];
    files: FileType[];
}> {
    const groupedTickets = threads.reduce<BlipThread[][]>((acc, thread) => {
        if (thread.type === "application/vnd.iris.ticket+json" || acc.length === 0) {
            acc.push([thread]);
        } else {
            acc[acc.length - 1].push(thread);
        }

        return acc;
    }, []);
    const files: FileType[] = [];
    const lastMessages = await Promise.all(
        groupedTickets.map(async (thread: BlipThread[]) =>
            (
                await Promise.all(
                    thread.map(async (e: BlipThread) => {
                        let message = "";
                        if (e.type === "application/vnd.iris.ticket+json")
                            message = `\n*** Ticket ${e.content.sequentialId} ***\n`;
                        else if (e.type === "application/vnd.lime.media-link+json") {
                            const { title, type, size, uri } = e.content;
                            files.push({
                                name: title as string,
                                type: type as string,
                                size: size as number,
                                url: uri as string,
                            });
                        } else
                            message = `[${moment(e.date).format("DD/MM/YYYY - HH:mm")}] ${getAuthorType(e).toUpperCase()}: ${
                                e.type !== "text/plain"
                                    ? e.content.text
                                        ? e.content.text
                                        : e.content.replied
                                        ? (e.content.replied as { value?: string }).value
                                        : e.content.interactive
                                        ? (e.content.interactive as { body: { text: string } }).body.text
                                        : e.content.templateContent
                                        ? (
                                              e.content as {
                                                  templateContent: { components: { type: string; text: string }[] };
                                              }
                                          ).templateContent.components.filter(
                                              (c: { type: string; text: string }) => c.type === "BODY"
                                          )[0].text
                                        : ""
                                    : e.content
                            }`;
                        return message;
                    })
                )
            ).join("\n")
        )
    );
    return {
        messages: lastMessages,
        files,
    };
}
