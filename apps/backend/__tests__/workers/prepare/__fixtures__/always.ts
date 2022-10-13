import sqsEvent from "./sqs-event";

export const event = sqsEvent({
  messageId: "1-581cf771-a006649127e371903a2de979",
  messageLocation: {
    path: {
      eventData: {},
      eventId: "7Y6AZRJMB845XGN7B3NE26PCW254",
      eventPreferences: {},
      eventProfile: {},
      recipientId: "07da6eed-acfb-4bca-9bc3-a2349437a9da",
      scope: "published/production",
    },
    type: "JSON",
  },
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
});

export const notification = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888002435,
  json: {
    blocks: [],
    channels: {
      always: [
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
          id: "f4e947cb-72b6-4565-9cc7-6020ee09d920",
          providers: [
            {
              config: {},
              configurationId: "f4e947cb-72b6-4565-9cc7-6020ee09d920",
            },
          ],
          taxonomy: "email:mailgun",
        },
      ],
    },
  },
  objtype: "event",
  id: "3f8cafe2-a2d0-42f6-a9d6-3ab83599c114",
  title: "Test Notification",
};
