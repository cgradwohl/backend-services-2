import { toUuid } from "~/lib/api-key-uuid";
import { IProfileObject } from "~/lib/dynamo/profiles";
import { mapPreferences } from "~/lib/preferences";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import {
  IPreference,
  IProfilePreferences,
  PreferenceStatus,
} from "~/types.public";

// TODO: replace this with something simple that @drew-y is proposing
const jsonMerger = require("json-merger");

async function getPreferencesFromGrouping(
  userId: string,
  tenantId: string,
  preferenceTemplateId: string,
  notificationId: string
) {
  const preferenceTemplateUuId = toUuid(preferenceTemplateId);

  const resourceId = `${userId}#${preferenceTemplateUuId}`;

  const recipientPreferencesIfExists = (
    await preferenceTemplateService(tenantId, "").get<{
      value: IPreference;
    }>("recipients", resourceId)
  )?.value;

  const defaultPreferences = await preferenceTemplateService(tenantId, "").get<{
    defaultStatus: PreferenceStatus;
  }>("templates", preferenceTemplateUuId!);

  return {
    notifications: {
      [notificationId]: {
        ...{ status: defaultPreferences },
        ...recipientPreferencesIfExists,
      },
    },
  };
}

export default async function getUserPreferences(
  userProfile: Pick<IProfileObject, "preferences" | "id">,
  tenantId: string,
  preferencesOverrides?: IProfilePreferences,
  preferenceTemplateId?: string,
  notificationId?: string
): Promise<IProfilePreferences> {
  const shouldCheckPreferencesFromGrouping =
    preferenceTemplateId && userProfile?.id;
  const preferencesFromGrouping = shouldCheckPreferencesFromGrouping
    ? await getPreferencesFromGrouping(
        userProfile.id,
        tenantId,
        preferenceTemplateId,
        notificationId!
      )
    : undefined;

  // order matters here, because we want to merge the default preferences
  // priority order:
  // 1. recipientProfilePreferences (if exists)
  // 2. preferenceTemplate (if exists)
  // 3. preferencesOverrides (if exists)

  return jsonMerger.mergeObjects(
    [userProfile?.preferences, preferencesFromGrouping, preferencesOverrides]
      .filter(Boolean)
      .map((preference) => mapPreferences(preference))
  );
}
