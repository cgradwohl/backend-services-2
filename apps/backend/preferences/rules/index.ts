import { toApiKey } from "~/lib/api-key-uuid";
import { mapPreferences } from "~/lib/preferences";
import { INotificationWire, NotificationCategory } from "~/types.api";
import { IProfilePreferences } from "~/types.public";
import type { Rule, RuleType } from "../types";
import { checkIfSnooze } from "./snooze";

export type PreferenceRules = {
  [key in RuleType]: (params: Rule) => boolean;
};

export const ruleHandlers: Partial<PreferenceRules> = {
  snooze: checkIfSnooze,
};

export const pluckPreferenceRulesByTypes = (
  category: Partial<NotificationCategory>,
  notification: Partial<INotificationWire>,
  recipientPreferences: Partial<IProfilePreferences>
): Rule[][] => {
  const categoryId = toApiKey(category?.id);
  const mappedPreferences = mapPreferences(recipientPreferences);
  const notificationId = toApiKey(notification?.id);

  const categoryPreference = recipientPreferences?.categories?.[categoryId];

  const notificationPreference =
    mappedPreferences?.notifications?.[notificationId];

  return [categoryPreference?.rules ?? [], notificationPreference?.rules ?? []];
};
