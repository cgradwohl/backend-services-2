import { toUuid } from "~/lib/api-key-uuid";
import {
  IPreferenceSection,
  IPreferenceTemplateAttachment,
} from "~/preferences/types";
import { IPreferences, IProfilePreferences } from "~/types.public";

function getPreferenceValue(
  userId: string,
  preferences: IPreferences,
  _meta: IPreferenceSection["_meta"] = "migrated-categories"
): Array<
  IPreferenceTemplateAttachment & {
    _meta: IPreferenceSection["_meta"];
  }
> {
  return Object.entries(preferences).flatMap(([id, value]) => ({
    _meta,
    resourceId: userId,
    resourceType: "recipients",
    templateId: toUuid(id),
    value: {
      status: value.status,
      ...(value?.channel_preferences && {
        channel_preferences: value.channel_preferences.map(
          ({ channel }) => channel
        ),
      }),
      ...(value?.rules?.length && {
        rules: value.rules,
      }),
    },
  }));
}

export function mapExistingUserPreferencesToV4(
  userId: string,
  preferences: IProfilePreferences
): Array<
  IPreferenceTemplateAttachment & {
    _meta: IPreferenceSection["_meta"];
  }
> {
  let mappedPreferences: Array<
    IPreferenceTemplateAttachment & {
      _meta: IPreferenceSection["_meta"];
    }
  > = [];
  /*
    preferences?.notifications = {
      [templateId]: {
        status: "OPTED_OUT",
      }
    } -> migrate this structure to the new structure
    {
      resourceId: toUUID(userId),
      resourceType: "recipients",
      templateId: toUUID(templateId),
    }
  */

  if (preferences?.notifications) {
    mappedPreferences = [
      ...mappedPreferences,
      ...getPreferenceValue(
        userId,
        preferences.notifications,
        "migrated-notifications"
      ),
    ];
  }

  if (preferences?.categories) {
    mappedPreferences = [
      ...mappedPreferences,
      ...getPreferenceValue(
        userId,
        preferences?.categories,
        "migrated-categories"
      ),
    ];
  }

  return mappedPreferences;
}
