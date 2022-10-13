import { toApiKey } from "~/lib/api-key-uuid";
import * as profilesService from "~/lib/dynamo/profiles";
import { assertAndDecodePathParam } from "~/lib/lambda-response";
import { IGetFn } from "./types";

const defaultPreferences = {
  categories: {},
  notifications: {},
};

export const get: IGetFn = async (context) => {
  const profileId = assertAndDecodePathParam(context, "id");
  const profile = await profilesService.get(context.tenantId, profileId);

  if (!profile || !profile.preferences) {
    return defaultPreferences;
  }

  // legacy preferences
  if (profile && (profile.preferences as any).preferred_channel) {
    return defaultPreferences;
  }

  const { categories = {}, notifications = {} } = profile.preferences;

  return {
    categories: Object.keys(categories).reduce((acc, categoryId) => {
      acc[toApiKey(categoryId)] = categories[categoryId];
      return acc;
    }, {}),
    notifications: Object.keys(notifications).reduce((acc, notificationId) => {
      acc[toApiKey(notificationId)] = notifications[notificationId];
      return acc;
    }, {}),
  };
};
