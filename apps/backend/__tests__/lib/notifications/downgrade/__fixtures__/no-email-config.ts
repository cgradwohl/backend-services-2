import { ILegacyNotificationWire } from "~/types.api";

export const noEmailConfig: ILegacyNotificationWire = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888002435,
  json: {
    strategyId: "4ef489c7-5d23-4696-984a-610d28d1f4d7",
    expoConfig: {
      subtitle: "Expo Subtitle",
      title: "Expo Title",
    },
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
      expo: {
        body: ["41c81cc7-4516-4ca3-bffa-9903471f3f76"],
      },
      "facebook-messenger": {
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
