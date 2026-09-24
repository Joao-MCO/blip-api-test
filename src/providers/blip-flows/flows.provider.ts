/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";

import { AppError } from "../../helpers";
import { ERROR_SCREEN, resolveScreen } from "./flows.provider.screens";
import { UseFlowsInput, UseFlowsOutput, FlowsData } from "./flows.provider.types";

export class Flows {
    async use(input: UseFlowsInput): Promise<UseFlowsOutput> {
        try {
            const { action, flow_token } = input;
            if (action === "ping") return { screen: "", data: { status: "active" } };
            let flowTokenData: FlowsData = {} as FlowsData;
            try {
                flowTokenData = JSON.parse(flow_token) as FlowsData;
            } catch (error) {
                return ERROR_SCREEN(input, error as Error);
            }
            if (action === "data_exchange") {
                const screenFn = resolveScreen(input.screen);
                return screenFn(input);
            }
            return ERROR_SCREEN(input);
        } catch (error) {
            return ERROR_SCREEN(input, error as Error);
        }
    }

    decryptPayload(body: any, privatePem: string, passphrase: string) {
        const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

        const privateKey = crypto.createPrivateKey({ key: privatePem.split(String.raw`\n`).join("\n"), passphrase });
        let decryptedAesKey = null;
        try {
            // decrypt AES key created by client
            decryptedAesKey = crypto.privateDecrypt(
                {
                    key: privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: "sha256",
                },
                Buffer.from(encrypted_aes_key, "base64")
            );
        } catch (error) {
            console.error(error);
            throw new AppError("Failed to decrypt the request. Please verify your private key.", 421);
        }

        // decrypt flow data
        const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
        const initialVectorBuffer = Buffer.from(initial_vector, "base64");

        const TAG_LENGTH = 16;
        const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
        const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

        const decipher = crypto.createDecipheriv("aes-128-gcm", decryptedAesKey, initialVectorBuffer);
        decipher.setAuthTag(encrypted_flow_data_tag);

        const decryptedJSONString = Buffer.concat([decipher.update(encrypted_flow_data_body), decipher.final()]).toString(
            "utf-8"
        );

        return {
            decryptedBody: JSON.parse(decryptedJSONString),
            aesKeyBuffer: decryptedAesKey,
            initialVectorBuffer,
        };
    }

    encryptPayload(response: any, aesKeyBuffer: Buffer<ArrayBuffer>, initialVectorBuffer: Buffer<ArrayBuffer>) {
        const flipped_iv: number[] = [];
        initialVectorBuffer.entries().forEach((pair) => {
            // eslint-disable-next-line no-bitwise
            flipped_iv.push(~pair[1]);
        });
        const cipher = crypto.createCipheriv("aes-128-gcm", aesKeyBuffer, Buffer.from(flipped_iv));
        return Buffer.concat([
            cipher.update(JSON.stringify(response), "utf-8"),
            cipher.final(),
            cipher.getAuthTag(),
        ]).toString("base64");
    }
}
