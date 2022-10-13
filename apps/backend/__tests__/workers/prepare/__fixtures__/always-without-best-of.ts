import sqsEvent from "./sqs-event";

export const event = sqsEvent({
  messageId: "1-581cf771-a006649127e371903a2de979",
  messageLocation: {
    path: {
      eventData: {},
      eventId: "BA64KQNSS9MYPKNN4XEQYANW6VTT",
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
  created: 1572888002435,
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  id: "5a8c49de-ce53-4f5a-ad49-d75f55786deb",
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
              configurationId: "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
            },
          ],
          taxonomy: "email:sendgrid",
        },
      ],
      bestOf: [],
    },
  },
  objtype: "event",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  title: "Test Notification",
};
