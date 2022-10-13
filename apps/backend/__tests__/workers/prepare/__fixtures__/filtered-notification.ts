import sqsEvent from "./sqs-event";

export const messageId = "1-581cf771-a006649127e371903a2de979";
export const tenantId = "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d";

export const event = sqsEvent({
  messageId,
  messageLocation: {
    path: {
      eventData: {},
      eventId: "MQ7ARFPFJ5MQZENXFT8M1VGSWMW0",
      eventPreferences: {},
      eventProfile: {
        email: "engineering@courier.com",
      },
      recipientId: "07da6eed-acfb-4bca-9bc3-a2349437a9da",
      scope: "published/production",
    },
    type: "JSON",
  },
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
});

export const notification = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId,
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
              configurationId: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
            },
          ],
          taxonomy: "direct_message:sms:twilio",
        },
      ],
    },
    conditional: {
      logicalOperator: "and",
      filters: [
        {
          source: "profile",
          property: "email",
          operator: "EQUALS",
          value: "engineering@courier.com",
        },
      ],
    },
  },
  objtype: "event",
  id: "a5ceac3e-7c8b-4bfd-af5f-a450dc33ca70",
  title: "Test Event",
};
