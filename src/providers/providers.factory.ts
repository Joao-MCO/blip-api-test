import { env } from "../config"
import { Blip } from "./blip";
import { Flows } from "./blip-flows";

export class ProviderFactory {
    static blipProvider() {
        return new Blip(env.BLIP_AUTHORIZATION_TOKEN);
    }

    static flowsProvider() {
        return new Flows();
    }
}
