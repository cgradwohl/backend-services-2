import { ISendMessageContext } from "~/send/types";
import {
  getUserPreference,
  mapPreferences,
  PreferenceUndeliveryReason,
} from "~/lib/preferences";
import { INotificationWire } from "~/types.api";
import isNotificationWire from "~/send/utils/is-notification-wire";
import {
  pluckPreferenceRulesByTypes,
  ruleHandlers,
  PreferenceRules,
} from "~/preferences/rules";

interface IRoutingLogByPreferences {
  type: PreferenceUndeliveryReason;
  reason: string;
  data: Record<string, unknown>;
}

/** Determines if user is subscribed to notification. Does not handle channel preferences */
export function getUserRoutingPreferences(
  context: ISendMessageContext
): IRoutingLogByPreferences | undefined {
  const preferences = mapPreferences(context?.preferences);
  const category = context?.category;
  const content = context.content;

  const notification = (isNotificationWire(content) &&
    content) as Partial<INotificationWire>;

  const userPreference = getUserPreference({
    category: context.category,
    notification: context.content as INotificationWire,
    preferences: context.preferences!,
    event: context.metadata?.event,
  });

  if (userPreference) {
    return {
      data: mapPreferences(preferences),
      reason: userPreference.message,
      type: userPreference.reason,
    };
  }

  const [categoryPreferenceRules, notificationPreferenceRules] =
    pluckPreferenceRulesByTypes(category!, notification, preferences);

  const [hasSnoozedCategory] = categoryPreferenceRules
    .filter((rule) => rule.type === "snooze")
    .map((rule) => (ruleHandlers as PreferenceRules)[rule.type](rule));

  const [hasSnoozedNotification] = notificationPreferenceRules
    .filter((rule) => rule.type === "snooze")
    .map((rule) => (ruleHandlers as PreferenceRules)[rule.type](rule));

  if (hasSnoozedCategory || hasSnoozedNotification) {
    const reason = hasSnoozedCategory
      ? "Snoozed at category level by user"
      : "Snoozed at notification level by user";

    return {
      data: {
        ...(categoryPreferenceRules !== null && { categoryPreferenceRules }),
        ...(notificationPreferenceRules !== null && {
          notificationPreferenceRules,
        }),
      },
      reason,
      type: "UNSUBSCRIBED",
    };
  }
}
