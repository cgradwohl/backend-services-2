import { validateNotificationPreferences } from "~/preferences/api/utils/validate-preferences";
import { IPreference } from "~/types.public";

describe("preferences validation", () => {
  const notification: IPreference = {
    channel_preferences: [{ channel: "direct_message" }],
    rules: [{ type: "snooze", until: "" }],
    status: "OPTED_IN",
  };

  it("should validate if template and notification preferences are valid", () => {
    expect(
      validateNotificationPreferences(
        "H4CHKV5GCYMYHNHM3VJF9BX1M5HR",
        "Mobile App template",
        notification,
        ["snooze", "channel_preferences"]
      )
    ).toBe(true);
  });

  it("should throw an error when notification preferences are invalid", () => {
    const { rules, ...preferences } = notification;
    const expectedErrorMessage =
      "preference type, snooze, is missing in notification H4CHKV5GCYMYHNHM3VJF9BX1M5HR, but its required in preference template Mobile App template";
    try {
      validateNotificationPreferences(
        "H4CHKV5GCYMYHNHM3VJF9BX1M5HR",
        "Mobile App template",
        preferences,
        ["channel_preferences"]
      );
    } catch (err) {
      expect(err.message).toBe(expectedErrorMessage);
    }
  });
});
