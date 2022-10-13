import uuidPackage from "uuid-apikey";

const cleanNotificationPreferences = (json) => {
  if (
    Object.keys(json).includes("preferences") &&
    Object.keys(json.preferences).includes("notifications")
  ) {
    let cleanPreferencesObject = {};

    Object.keys(json.preferences.notifications).map((key) => {
      const notificationId = uuidPackage.isAPIKey(key)
        ? key
        : uuidPackage.toAPIKey(key);
      //toApikey is not excluding hyphens.
      const cleanNotificationId = notificationId.replace(/-\b|\b-/g, "");
      cleanPreferencesObject[cleanNotificationId] =
        json.preferences.notifications[key];
    });

    const newJson = {
      ...json,
      preferences: {
        ...json.preferences,
        notifications: { ...cleanPreferencesObject },
      },
    };
    return newJson;
  } else {
    return json;
  }
};

export default cleanNotificationPreferences;
