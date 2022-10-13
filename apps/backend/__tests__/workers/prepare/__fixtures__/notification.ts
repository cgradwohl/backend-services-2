import sqsEvent from "./sqs-event";

const getSqsEvent = (retryCount?: number) =>
  sqsEvent({
    messageId: "1-581cf771-a006649127e371903a2de979",
    messageLocation: {
      path: {
        eventData: {},
        eventId: "BKNEYT7G40M6ZGKA69F1QD2566H0",
        eventPreferences: {},
        eventProfile: {},
        recipientId: "07da6eed-acfb-4bca-9bc3-a2349437a9da",
        scope: "published/production",
      },
      type: "JSON",
    },
    retryCount,
    tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  });

export const event = getSqsEvent();

export const eventWithElevenRetries = getSqsEvent(11);

export const eventWithTwentySixRetries = getSqsEvent(26);

export const notification = {
  created: 1572888002435,
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  id: "5ceaef68-8101-437e-9a8c-9786688a6344",
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
          id: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
          providers: [
            {
              config: {},
              configurationId: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
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
                headerLogoAlign: "left",
                templateName: "line",
                topBarColor: "#58C87A",
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
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  title: "Test Notification",
};
