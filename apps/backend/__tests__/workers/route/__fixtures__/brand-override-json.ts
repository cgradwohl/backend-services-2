import sqsEvent from "./sqs-event";
import uuid from "uuid";

const emailChannelId = uuid.v4();
const tenantId = uuid.v4();
const sendgridConfigId = uuid.v4();
const eventId = uuid.v4();
const brandId = uuid.v4();

export const overrideBrand = {
  settings: {
    colors: {
      primary: "purple",
      secondary: "green",
      tertiary: "pink",
    },
  },
};

export const event = sqsEvent({
  messageId: "1-4707e599cf0d485490a0c0faffb5bdb5",
  tenantId,
  type: "route",
  messageLocation: {
    type: "JSON",
    path: {
      data: {},
      eventId,
      brand: {
        id: String(brandId),
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        created: 1572888001972,
        name: "Test Brand",
        updated: 1572888001972,
        updater: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        settings: {
          email: {},
          colors: {
            primary: "red",
            secondary: "white",
            tertiary: "blue",
          },
        },
        version: "mockVersion",
      },
      override: {
        brand: overrideBrand,
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
          id: sendgridConfigId,
          title: "SendGrid",
        },
      ],
      notification: {
        created: 1572888002435,
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        id: eventId,
        json: {
          blocks: [],
          channels: {
            always: [],
            bestOf: [
              {
                blockIds: [],
                config: {
                  email: {
                    emailSubject: "Email Subject",
                    emailTemplateConfig: {
                      templateName: "line",
                      topBarColor: "#58C87A",
                      headerLogoAlign: "left",
                    },
                  },
                },
                id: emailChannelId,
                providers: [
                  {
                    config: {},
                    key: "sendgrid",
                    configurationId: sendgridConfigId,
                  },
                ],
                taxonomy: "email:sendgrid",
              },
            ],
          },
        },
        objtype: "event",
        tenantId,
        title: "Test Notification",
      },
      extendedProfile: null,
      preferences: {
        categories: {},
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
