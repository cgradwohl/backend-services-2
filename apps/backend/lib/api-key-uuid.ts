import uuidAPIKey from "uuid-apikey";

export const isAPIKey = (apiKey: string): boolean | undefined => {
  const re = /^[0-9A-Z]*$/;
  return apiKey?.length === 28 && re.test(apiKey);
};

export const toApiKey = (
  uuid: string,
  options?: { noDashes?: boolean }
): string | undefined => {
  if (!uuid) {
    return;
  }

  if (!uuidAPIKey.isUUID(uuid)) {
    return uuid;
  }

  return uuidAPIKey.toAPIKey(uuid, { noDashes: options?.noDashes ?? true });
};

export const toUuid = (apiKey: string): string | undefined => {
  if (!apiKey) {
    return;
  }

  if (!isAPIKey(apiKey)) {
    return apiKey;
  }

  return uuidAPIKey.toUUID(apiKey);
};
