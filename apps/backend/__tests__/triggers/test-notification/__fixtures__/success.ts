import sqsEvent from "./sqs-event";
import uuid from "uuid";
import { CourierRenderOverrides } from "~/types.internal";

export const channelId = uuid.v4();
export const notificationId = uuid.v4();
export const tenantId = uuid.v4();
export const recipientId = uuid.v4();
export const notificationMessage: {
  brandId?: string;
  channelId: string;
  courier: CourierRenderOverrides;
  draftId: string;
  eventData: any;
  eventProfile: any;
  messageId: string;
  notificationId: string;
  recipientId: string;
  tenantId: string;
  userPoolId?: string;
  users?: Array<string>;
} = {
  messageId: "1-581cf771-a006649127e371903a2de979",
  channelId,
  courier: {
    environment: "production",
    scope: "published",
  },
  eventData: {
    test: "test",
  },
  eventProfile: {
    email: "riley@courier.com",
  },
  notificationId,
  draftId: undefined,
  tenantId,
  recipientId,
  users: ["123"],
};
export const event = sqsEvent(notificationMessage);

export const selectedChannel = {
  blockIds: [],
  config: {
    email: {
      emailFrom: "from@example.com",
      emailReplyTo: "reply@example.com",
      emailCC: "cc@example.com",
      emailBCC: "bcc@example.com",
      emailSubject: "Email Subject",
      emailTemplateConfig: {
        templateName: "line",
        topBarColor: "#58C87A",
        headerLogoAlign: "left",
      },
    },
  },
  id: channelId,
  providers: [],
  taxonomy: "email:*",
};

export const notification = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888002435,
  json: {
    blocks: [],
    channels: {
      always: [],
      bestOf: [selectedChannel],
    },
  },
  objtype: "event",
  id: notificationId,
  title: "Test Notification",
};
