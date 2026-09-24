import { AppError } from "./error";

const DDDs = new Set([
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "21",
    "22",
    "24",
    "27",
    "28",
    "31",
    "32",
    "33",
    "34",
    "35",
    "37",
    "38",
    "41",
    "42",
    "43",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
    "51",
    "53",
    "54",
    "55",
    "61",
    "62",
    "63",
    "64",
    "65",
    "66",
    "67",
    "68",
    "69",
    "71",
    "73",
    "74",
    "75",
    "77",
    "79",
    "81",
    "82",
    "83",
    "84",
    "85",
    "86",
    "87",
    "88",
    "89",
    "91",
    "92",
    "93",
    "94",
    "95",
    "96",
    "97",
    "98",
    "99",
]);

export const removeNonDigits = (value: string): string => {
    return value.replace(/\D/g, "");
};

export const phoneSanitizer = (phoneNumber: string): string => {
    let ddd = "";
    let number = "";
    if (phoneNumber.startsWith("55") && (phoneNumber.length === 12 || phoneNumber.length === 13)) {
        ddd = phoneNumber.substring(2, 4);
        number = phoneNumber.substring(4);
    } else if (phoneNumber.length === 10 || phoneNumber.length === 11) {
        ddd = phoneNumber.substring(0, 2);
        number = phoneNumber.substring(2);
    } else {
        throw new AppError("Formato de telefone inválido.");
    }
    if (number.length === 8) number = `9${number}`;
    if (number.length !== 9) throw new AppError("Número de celular inválido.");
    return `55${ddd}${number}`;
};

export const isGuid = (codex: string): boolean => {
    const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(codex);
};

export function isValidBrazilianPhone(phone: string) {
    let value = String(phone);

    if (value.startsWith("55")) {
        value = value.substring(2);
    }

    if (!/^\d+$/.test(value)) {
        return false;
    }

    const ddd = value.substring(0, 2);

    if (!DDDs.has(ddd)) {
        return false;
    }

    const number = value.substring(2);

    if (number.length === 9) {
        return /^9\d{8}$/.test(number);
    }

    if (number.length === 8) {
        return /^[2-5]\d{7}$/.test(number);
    }

    return false;
}

export function getValueByPath(data: any, path: string): unknown {
    return path.split(".").reduce((value, key) => value?.[key], data);
}
