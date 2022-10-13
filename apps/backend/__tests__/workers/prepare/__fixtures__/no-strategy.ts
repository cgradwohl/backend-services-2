import sqsEvent from "./sqs-event";

export const event = sqsEvent({
  messageId: "1-5e0f64f5-01f25aca9d89333c7eeaee16",
  messageLocation: {
    path: {
      eventData: {},
      eventId: "HJXJ5YYH3G82YEMY6C7BQ7XPHEFN",
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
      bestOf: [],
    },
  },
  objtype: "event",
  id: "8cbb22fb-88e0-8179-a78c-c3ae3f6d173e",
  title: "Test Notification",
};
