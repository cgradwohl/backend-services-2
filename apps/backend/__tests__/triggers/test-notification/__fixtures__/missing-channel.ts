import sqsEvent from "./sqs-event";
import uuid from "uuid";

export const channelId = uuid.v4();
export const notificationId = uuid.v4();
export const tenantId = uuid.v4();
export const recipientId = uuid.v4();

export const event = sqsEvent({
  messageId: "1-581cf771-a006649127e371903a2de979",
  channelId,
  courier: {
    environment: "production",
    scope: "published",
  },
  draftId: undefined,
  eventData: {
    test: "test",
  },
  eventProfile: {},
  notificationId,
  tenantId,
  recipientId,
  users: ["123"],
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
  id: notificationId,
  title: "Test Notification",
};
