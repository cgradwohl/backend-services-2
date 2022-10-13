import sqsEvent from "./sqs-event";

export const event = sqsEvent({
  messageId: "1-581cf771-a00787849127e371903a2de979",
  messageLocation: {
    path: {
      eventData: {},
      eventId: "GT4NXN70DC40FVM1TWEXAJAXTE4T",
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
      always: [],
      bestOf: [
        {
          blockIds: [],
          id: "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
          providers: [
            {
              config: {},
              configurationId: null,
            },
          ],
          taxonomy: "email:sendgrid",
        },
      ],
    },
  },
  objtype: "event",
  id: "86895ed4-0358-403f-a075-c77592bba713",
  title: "Test Notification",
};
