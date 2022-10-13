import { MessageRouting } from "~/api/send/types";
import { toUuid } from "~/lib/api-key-uuid";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import { IPreference } from "~/types.public";

/**
 * Get's a user provided routing strategy. Only used by get-routing, which is the function
 * you are probably looking for. Not this one.
 */
export async function getUserRouting({
  userId,
  tenantId,
  preferenceTemplateId,
}: {
  userId?: string;
  tenantId: string;
  preferenceTemplateId?: string;
}): Promise<MessageRouting | undefined> {
  if (!userId || !preferenceTemplateId) {
    return undefined;
  }

  const preferenceTemplateUuId = toUuid(preferenceTemplateId);

  const resourceId = `${userId}#${preferenceTemplateUuId}`;

  const recipientPreferencesIfExists = (
    await preferenceTemplateService(tenantId, "").get<{
      value: IPreference;
    }>("recipients", resourceId)
  )?.value;

  const shouldUseExistingStrategy =
    !recipientPreferencesIfExists?.hasCustomRouting;

  if (shouldUseExistingStrategy) return undefined;

  const routingPreferencesForCurrentUser =
    recipientPreferencesIfExists?.routingPreferences;

  return {
    method: "all",
    channels: [...routingPreferencesForCurrentUser],
  };
}
