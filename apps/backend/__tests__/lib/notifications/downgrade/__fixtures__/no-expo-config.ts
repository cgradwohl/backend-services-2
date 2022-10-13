import { ILegacyNotificationWire } from "~/types.api";

export const noExpoConfig: ILegacyNotificationWire = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888002435,
  json: {
    strategyId: "67f6d2af-53e0-4761-bd83-65ffcb113ffa",
    emailReplyTo: "reply-to@courier.com",
    emailSubject: "Email Subject",
    emailTemplateConfig: {
      templateName: "line",
      topBarColor: "#58C87A",
      headerLogoAlign: "left",
    },
    isUsingTemplateOverride: true,
    templateOverride: "{{template_override}}",
    fbMessengerConfig: {
      tag: "#trycourier",
      fromAddress: "@trycourier",
    },
    blocks: [
      {
        type: "text",
        config: null,
        id: "37e68bc2-87c0-4b82-a4da-fb1b2444bdc9",
      },
    ],
    providers: {
      "facebook-messenger": {
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
