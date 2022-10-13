import sqsEvent from "./sqs-event";
import uuid from "uuid";

const categoryId = uuid.v4();
export const messageId = "1-5e0f64f5-01f25aca9d89333c7eeaee16";
export const tenantId = "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d";

export const event = sqsEvent({
  messageId,
  tenantId,
  messageLocation: {
    type: "JSON",
    path: {
      category: {
        objtype: "notification-category",
        tenantId,
        id: categoryId,
        title: "Mock Category",
        json: {
          notificationConfig: {
            type: "OPT_OUT",
          },
        },
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        created: 1572888001972,
      },
      configurations: [
        {
          creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
          tenantId,
          created: 1572888001972,
          json: {
            apiKey: "SuperDuperSecretApiKey",
            provider: "sendgrid",
          },
          objtype: "configuration",
          id: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
          title: "SendGrid",
        },
        {
          creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
          tenantId,
          created: 1572888001972,
          json: {
            apiKey: "SuperDuperSecretApiKey",
            messagingServiceSid: "serviceSid",
            provider: "twilio",
          },
          objtype: "configuration",
          id: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
          title: "Twilio",
        },
      ],
      notification: {
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        tenantId,
        created: 1572888002435,
        json: {
          blocks: [],
          categoryId,
          channels: {
            always: [],
            bestOf: [
              {
                blockIds: [],
                config: {
                  email: {
                    emailSubject: "Email Subject",
                    emailTemplateConfig: {
                      headerLogoAlign: "left",
                      templateName: "line",
                      topBarColor: "#58C87A",
                    },
                  },
                },
                id: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
                providers: [
                  {
                    config: {},
                    key: "sendgrid",
                    configurationId: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
                  },
                ],
                taxonomy: "email:sendgrid",
              },
              {
                blockIds: [],
                config: {},
                id: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
                providers: [
                  {
                    config: {},
                    key: "twilio",
                    configurationId: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
                  },
                ],
                taxonomy: "direct_message:sms:twilio",
              },
            ],
          },
        },
        objtype: "event",
        id: "4cbb22fb-48e0-4179-a74c-c3ae3f6d173e",
        title: "Test Event",
      },
      extendedProfile: null,
      preferences: {
        categories: {
          [categoryId]: {
            status: "OPTED_OUT",
          },
        },
        notifications: {},
      },
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
