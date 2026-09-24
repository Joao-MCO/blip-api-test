/* eslint-disable no-new */
import { describe, expect, it } from "vitest";

import { IdentityError } from "../helpers";
import { Identity } from "./identity.vo";

describe("create identity", () => {
    it("without extra 9", () => {
        const identity = new Identity("553598636060");
        expect(identity).instanceOf(Identity);
        expect(identity.getValue()).toBe("5535998636060");
        expect(identity.getValue().length).toBe(13);
    });

    it("without country code", () => {
        const identity = new Identity("3598636060");
        expect(identity).instanceOf(Identity);
        expect(identity.getValue()).toBe("5535998636060");
        expect(identity.getValue().length).toBe(13);
    });

    it("without country code and DDD equal 55", () => {
        const identity = new Identity("5598636060");
        expect(identity).instanceOf(Identity);
        expect(identity.getValue()).toBe("5555998636060");
        expect(identity.getValue().length).toBe(13);
    });

    it("dirty phone number", () => {
        const identity = new Identity("+55 (11) 994071425");
        expect(identity).instanceOf(Identity);
        expect(identity.getValue()).toBe("5511994071425");
        expect(identity.getValue().length).toBe(13);
    });

    it("invalid phone number (empty)", () => {
        expect(() => {
            new Identity("");
        }).toThrow(new IdentityError("Identity não informado.", ""));
    });

    it("invalid phone number (invalid)", () => {
        expect(() => {
            new Identity("invalid-phone");
        }).toThrow(new IdentityError("O identity precisa ter no mínimo 10 dígitos.", ""));
    });

    it("invalid phone number (very short)", () => {
        expect(() => {
            new Identity("994071425");
        }).toThrow(new IdentityError("O identity precisa ter no mínimo 10 dígitos.", "994071425"));
    });
});
