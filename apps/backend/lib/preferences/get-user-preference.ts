import {
  INotificationConfig,
  INotificationWire,
  NotificationCategory,
} from "~/types.api";
import { IProfilePreferences, PreferenceStatus } from "~/types.public";
import { toApiKey } from "~/lib/api-key-uuid";
import { IMessageLog } from "~/lib/message-service/types";

export type PreferenceUndeliveryReason = Extract<
  IMessageLog["reason"],
  "UNSUBSCRIBED" | "OPT_IN_REQUIRED"
>;

export const NOTIFICATION_TYPES: {
  [key: string]: INotificationConfig["type"];
} = {
  OPT_IN: "OPT_IN",
  OPT_OUT: "OPT_OUT",
  REQUIRED: "REQUIRED",
};

export const PREFERENCE_STATUS: {
  [key in PreferenceStatus]: PreferenceStatus;
} = {
  OPTED_IN: "OPTED_IN",
  OPTED_OUT: "OPTED_OUT",
  REQUIRED: "REQUIRED",
};

type MapPreferncesFn = (
  preferences?: Partial<IProfilePreferences>,
  mapFn?: typeof toApiKey
) => Partial<IProfilePreferences>;

export const mapPreferences: MapPreferncesFn = (
  preferences,
  mapFn = toApiKey
) => {
  const {
    notifications: notificationsPreferences,
    categories: categoriesPreferences,
  } = preferences ?? { notifications: null, categories: null };

  const mappedPreferences: IProfilePreferences = {
    categories: null,
    notifications: null,
  };

  if (notificationsPreferences) {
    mappedPreferences.notifications = Object.keys(
      notificationsPreferences
    ).reduce(
      (allPreferences, notificationId) => ({
        ...allPreferences,
        [mapFn(notificationId)]: notificationsPreferences[notificationId],
      }),
      {}
    );
  }

  if (categoriesPreferences) {
    mappedPreferences.categories = Object.keys(categoriesPreferences).reduce(
      (allPreferences, categoryId) => ({
        ...allPreferences,
        [mapFn(categoryId)]: categoriesPreferences[categoryId],
      }),
      {}
    );
  }

  return mappedPreferences;
};

export const getUserPreference = ({
  category,
  notification,
  preferences,
  event,
}: {
  category?: Partial<NotificationCategory>;
  notification: Partial<INotificationWire>;
  preferences: Partial<IProfilePreferences>;
  event?: string;
}): {
  reason: PreferenceUndeliveryReason;
  message: string;
} => {
  const mappedPreferences = mapPreferences(preferences);

  if (category) {
    const categoryId = toApiKey(category?.id);
    const categoryConfig = category?.json?.notificationConfig;
    const categoryPreference = mappedPreferences?.categories?.[categoryId];

    if (categoryConfig?.type === NOTIFICATION_TYPES.REQUIRED) {
      return;
    }

    if (categoryPreference?.status === PREFERENCE_STATUS.OPTED_OUT) {
      return {
        message: `Category, ${category.title}, opted out by user`,
        reason: "UNSUBSCRIBED",
      };
    }

    if (
      categoryConfig?.type === NOTIFICATION_TYPES.OPT_IN &&
      categoryPreference?.status !== PREFERENCE_STATUS.OPTED_IN
    ) {
      return {
        message: `Category, ${category.title}, requires explicit opt in`,
        reason: "OPT_IN_REQUIRED",
      };
    }
  }

  const notificationId = event ?? toApiKey(notification?.id);
  const notificationConfig = notification?.json?.config;
  const notificationPreference =
    mappedPreferences?.notifications?.[notificationId];

  if (notificationConfig?.type === NOTIFICATION_TYPES.REQUIRED) {
    return;
  }

  if (notificationPreference?.status === PREFERENCE_STATUS.OPTED_OUT) {
    return {
      message: `Notification opted out by user`,
      reason: "UNSUBSCRIBED",
    };
  }

  if (
    notificationConfig?.type === NOTIFICATION_TYPES.OPT_IN &&
    notificationPreference?.status !== PREFERENCE_STATUS.OPTED_IN
  ) {
    return {
      message: `Notification requires explicit opt in`,
      reason: "OPT_IN_REQUIRED",
    };
  }
};
