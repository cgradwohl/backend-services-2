import sqsEvent from "./sqs-event";

export const event = sqsEvent({
  messageId: "1-4707e599cf0d485490a0c0faffb5bdb5",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  messageLocation: {
    type: "JSON",
    path: {
      configurations: [
        {
          creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
          tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
          created: 1572888001972,
          json: {
            apiKey: "SuperDuperSecretApiKey",
            provider: "sendgrid",
          },
          objtype: "configuration",
          id: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
          title: "SendGrid",
        },
      ],
      notification: {
        created: 1572888002435,
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        id: "5a8c49de-ce53-4f5a-ad49-d75f55786deb",
        json: {
          blocks: [],
          channels: {
            always: [],
            bestOf: [],
          },
        },
        objtype: "event",
        tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        title: "Test Notification",
      },
      extendedProfile: null,
      preferences: {},
      profile: {
        email: "engineering@courier.com",
      },
      recipientId: "recipient-id",
      sentProfile: {
        email: "engineering@courier.com",
      },
    },
  },
});
