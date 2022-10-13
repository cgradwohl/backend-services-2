import { ILegacyNotificationWire } from "~/types.api";

export const noFacebookMessengerConfig: ILegacyNotificationWire = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888002435,
  json: {
    strategyId: "2c6a5416-e2d5-4229-a40f-833f3e28b71a",
    emailReplyTo: "reply-to@courier.com",
    emailSubject: "Email Subject",
    emailTemplateConfig: {
      templateName: "line",
      topBarColor: "#58C87A",
      headerLogoAlign: "left",
    },
    isUsingTemplateOverride: true,
    templateOverride: "{{template_override}}",
    expoConfig: {
      subtitle: "Expo Subtitle",
      title: "Expo Title",
    },
    blocks: [
      {
        type: "text",
        config: null,
        id: "37e68bc2-87c0-4b82-a4da-fb1b2444bdc9",
      },
    ],
    providers: {
      expo: {
        body: ["41c81cc7-4516-4ca3-bffa-9903471f3f76"],
      },
      sendgrid: {
        body: ["41c81cc7-4516-4ca3-bffa-9903471f3f76"],
      },
      twilio: {
        body: ["41c81cc7-4516-4ca3-bffa-9903471f3f76"],
      },
    },
  },
  objtype: "event",
  id: "4cbb22fb-48e0-4179-a74c-c3ae3f6d173e",
  title: "Notification Test",
};
