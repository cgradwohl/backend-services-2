import sqsEvent from "./sqs-event";

export const sendgridConfig = {
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
};

export const event = sqsEvent({
  messageId: "1-5e0f64f5-01f25aca9d89333c7eeaee16",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  messageLocation: {
    type: "JSON",
    path: {
      configurations: [sendgridConfig],
      notification: {
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        created: 1572888002435,
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
                id: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
                providers: [
                  {
                    config: {},
                    configurationId: sendgridConfig.id,
                  },
                ],
                taxonomy: "email:sendgrid",
              },
            ],
          },
        },
        objtype: "event",
        id: "4cbb22fb-48e0-4179-a74c-c3ae3f6d173e",
        title: "Test Event",
      },
      extendedProfile: null,
      profile: {},
      recipientId: "recipient-id",
      sentProfile: {},
    },
  },
});
