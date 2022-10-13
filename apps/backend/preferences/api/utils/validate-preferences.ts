import { toApiKey } from "~/lib/api-key-uuid";
import { HttpError } from "~/lib/http-errors";
import {
  AllowedPreferences,
  PreferenceTemplateItems,
} from "~/preferences/types";
import { IPreference } from "~/types.public";

interface ITemplateValidationError extends HttpError {
  message: string;
}

export function assertIsTemplateValidationError(err: {
  message: string;
}): err is ITemplateValidationError {
  return err.message.startsWith("preference type");
}

export const validateNotificationPreferences = (
  notificationId: string,
  templateName: string,
  notification: IPreference,
  allowedPreferences: AllowedPreferences
): boolean => {
  const { rules = [], channel_preferences = null } = notification;
  const validationLookup = {
    ...(channel_preferences !== null && { channel_preferences }),
    ...(rules.length > 0 &&
      rules.reduce(
        (acc, current) => ({
          ...acc,
          [current.type]: current,
        }),
        {}
      )),
  };

  for (const preference of allowedPreferences) {
    if (!(preference in validationLookup)) {
      throw new Error(
        `preference type, ${preference}, is missing in notification ${toApiKey(
          notificationId
        )}, but its required in preference template ${templateName}`
      );
    }
  }
  return true;
};
