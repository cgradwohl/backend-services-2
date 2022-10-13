import { RecipientToken, WriteableRecipientToken } from "~/lib/token-storage";
import { IUsersPutTokenData, IUsersTokenData } from "~/types.public";

export function usersTokenBodyToWritableRecipientToken(
  body: IUsersPutTokenData & {
    tenantId: string;
    recipientId: string;
    token: string;
  }
): WriteableRecipientToken {
  const data: WriteableRecipientToken = {
    tenantId: body.tenantId,
    recipientId: body.recipientId,
    token: body.token,
    properties: body.properties,
    providerKey: body.provider_key,
    status: body.status ?? "unknown",
    statusReason: body.status_reason,
    expiryDate: body.expiry_date,
    ...(body.device
      ? {
          device: {
            appId: body.device.app_id,
            adId: body.device.ad_id,
            deviceId: body.device.device_id,
            platform: body.device.platform,
            manufacturer: body.device.manufacturer,
            model: body.device.model,
          },
        }
      : {}),
    ...(body.tracking
      ? {
          tracking: {
            osVersion: body.tracking.os_version,
            ip: body.tracking.ip,
            lat: body.tracking.lat,
            long: body.tracking.long,
          },
        }
      : {}),
  };

  return data;
}

export function recipientTokenToUsersTokenBody(
  token: RecipientToken
): IUsersTokenData {
  return {
    token: token.token,
    last_used: token.lastUsed,
    properties: token.properties,
    provider_key: token.providerKey as string,
    status: token.status,
    status_reason: token.statusReason,
    expiry_date: token.expiryDate,
    ...(token.device
      ? {
          device: {
            app_id: token.device.appId,
            ad_id: token.device.adId,
            device_id: token.device.deviceId,
            platform: token.device.platform,
            manufacturer: token.device.manufacturer,
            model: token.device.model,
          },
        }
      : {}),
    ...(token.tracking
      ? {
          tracking: {
            os_version: token.tracking.osVersion,
            ip: token.tracking.ip,
            lat: token.tracking.lat,
            long: token.tracking.long,
          },
        }
      : {}),
  };
}
