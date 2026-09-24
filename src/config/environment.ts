import envVar from "env-var";

export const env = {
    APP_PORT: envVar.get("APP_PORT").default(3333).asInt(),
    LOG: envVar.get("LOG").default("false").asBool(),
    AUTH_TOKEN: envVar.get("AUTH_TOKEN").required().asString(),
    BLIP_TENANT: envVar.get("BLIP_TENANT").required().asString(),
    BLIP_AUTHORIZATION_TOKEN: envVar.get("BLIP_AUTHORIZATION_TOKEN").required().asString(),
    BLIP_ATTENDANCE_TOKEN: envVar.get("BLIP_ATTENDANCE_TOKEN").required().asString(),
    MONGODB_URL: envVar.get("MONGODB_URL").required().asString(),
    MONGODB_DATABASE: envVar.get("MONGODB_DATABASE").required().asString(),
    BLIP_ATTENDANCE_NAME: envVar.get("BLIP_ATTENDANCE_NAME").required().asString(),
};
