import sqsEvent from "./sqs-event";
import uuid from "uuid";

export const categoryId = uuid.v4();
export const messageId = "1-5e0f64f5-01f25aca9d89333c7eeaee16";
export const notificationId = uuid.v4();

export const tenantId = uuid.v4();
export const sendgridConfig = {
  creator: uuid.v4(),
  tenantId,
  created: 1572888001972,
  json: {
    apiKey: "SuperDuperSecretApiKey",
    provider: "sendgrid",
  },
  objtype: "configuration",
  id: uuid.v4(),
  title: "SendGrid",
};

export const twilioConfig = {
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
};

export const event = sqsEvent({
  messageId,
  tenantId,
  messageLocation: {
    type: "JSON",
    path: {
      category: {
        id: categoryId,
        json: {
          notificationConfig: {
            required: false,
          },
        },
      },
      configurations: [sendgridConfig, twilioConfig],
      event: {
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        tenantId,
        created: 1572888002435,
        json: {
          config: {
            required: true,
            inheritConfig: false,
          },
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
                      templateName: "line",
                      topBarColor: "#58C87A",
                      headerLogoAlign: "left",
                    },
                  },
                },
                id: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
                providers: [
                  {
                    config: {},
                    configurationId: sendgridConfig.id,
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
                    configurationId: twilioConfig.id,
                  },
                ],
                taxonomy: "direct_message:sms:twilio",
              },
            ],
          },
        },
        objtype: "event",
        id: notificationId,
        title: "Test Event",
      },
      extendedProfile: null,
      preferences: {
        notifications: {
          [notificationId]: {
            disabled: true,
          },
        },
        categories: {
          [categoryId]: {
            disabled: true,
          },
        },
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
