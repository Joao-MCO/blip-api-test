import credentialsProd from "../credentials";
import credentialsHomolog from "../credentials.homolog";
import { AppError } from "../helpers";
import { ProviderFactory } from "../providers";
import { UseFlowsInput } from "../providers/blip-flows";

export const startFlows = async (data: string, environment?: string, testing?: boolean) => {
    const credentials = environment === "homolog" ? credentialsHomolog : credentialsProd;
    if (!credentials.private_key) throw new AppError('Private key is empty. Please check your env variable "PRIVATE_KEY".');
    const flows = ProviderFactory.flowsProvider();
    if (testing) {
        console.log("💬 Decrypted Request:", data);
        const response = await flows.use(data as unknown as UseFlowsInput);
        console.log("👉 Response to Encrypt:", response);
        return response;
    }
    const decryptedRequest = flows.decryptPayload(data, credentials.private_key, credentials.passphrase);
    const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
    console.log("💬 Decrypted Request:", decryptedBody);
    const response = await flows.use(decryptedBody);
    console.log("👉 Response to Encrypt:", response);
    return flows.encryptPayload(response, aesKeyBuffer, initialVectorBuffer);
};
