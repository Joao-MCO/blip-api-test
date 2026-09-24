import { IdentityError, isValidBrazilianPhone, phoneSanitizer } from "../helpers";

export class Identity {
    private identity: string;
    private channel: string;

    constructor(identity: string) {
        if (!identity) throw new IdentityError("Identity não informado.", identity);
        const [i, channel] = identity.split("@");
        this.channel = channel ?? "wa.gw.msging.net";
        this.identity = isValidBrazilianPhone(i) ? phoneSanitizer(i) : i;
    }

    getValue() {
        return this.identity;
    }

    getChannel() {
        return this.channel;
    }

    getFullIdentity() {
        return `${this.identity}@${this.channel}`;
    }
}
