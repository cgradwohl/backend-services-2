import uuid from "uuid";

import sqsEvent from "./sqs-event";

export const sendgridConfig = {
  created: 1572888001972,
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  id: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
  json: {
    apiKey: "SuperDuperSecretApiKey1",
    provider: "sendgrid",
  },
  objtype: "configuration",

  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  title: "SendGrid",
};

export const sendgridConfig2 = {
  created: 1572888001973,
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  id: uuid.v4(),
  json: {
    apiKey: "SuperDuperSecretApiKey2",
    provider: "sendgrid",
  },
  objtype: "configuration",

  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  title: "SendGrid",
};

export const event = sqsEvent({
  messageId: "1-5e0f64f5-01f25aca9d89333c7eeaee16",
  messageLocation: {
    path: {
      configurations: [sendgridConfig, sendgridConfig2],
      notification: {
        created: 1572888002435,
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        extendedProfile: null,
        id: "4cbb22fb-48e0-4179-a74c-c3ae3f6d173e",
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
                      headerLogoAlign: "left",
                      templateName: "line",
                      topBarColor: "#58C87A",
                    },
                  },
                },
                id: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
                providers: [
                  {
                    conditional: {
                      behavior: "show",
                      filters: [
                        {
                          operator: "EQUALS",
                          property: "email",
                          source: "profile",
                          value: "engineering@courier.com",
                        },
                      ],
                      logicalOperator: "and",
                    },
                    config: {},
                    configurationId: sendgridConfig.id,
                  },
                  {
                    config: {},
                    configurationId: sendgridConfig2.id,
                  },
                ],
                taxonomy: "email:sendgrid",
              },
            ],
          },
        },
        objtype: "event",
        title: "Test Event",
      },
      profile: {
        email: "engineerin@courier.com",
        phone_number: "5558675309",
      },
      recipientId: "recipient-id",
      sentProfile: {
        email: "engineerin@courier.com",
      },
      tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
    },
    type: "JSON",
  },
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
});
