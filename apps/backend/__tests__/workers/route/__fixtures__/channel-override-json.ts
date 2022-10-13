import sqsEvent from "./sqs-event";
import uuid from "uuid";

const emailChannelId = uuid.v4();
const tenantId = uuid.v4();
const sendgridConfigId = uuid.v4();

const pushChannelId = uuid.v4();
const pushConfigId = uuid.v4();
const eventId = uuid.v4();

export const overrideChannel = {
  email: {
    bcc: "override@bcc.com",
    cc: "override@cc.com",
    from: "override@from.com",
    html: "<div>Override Html</div>",
    replyTo: "override@reply-to.com",
    subject: "Override Email Subject",
    text: "Override Text",
  },
  push: {
    body: "Body Override",
    icon: "Override Icon",
    title: "Override Title",
  },
};

export const emailEvent = sqsEvent({
  messageId: "1-4707e599cf0d485490a0c0faffb5bdb5",
  tenantId,
  type: "route",
  messageLocation: {
    type: "JSON",
    path: {
      data: {},
      eventId,
      override: {
        channel: overrideChannel,
      },
      configurations: [
        {
          creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
          tenantId,
          created: 1572888001972,
          json: {
            apiKey: "SuperDuperSecretApiKey",
            provider: "sendgrid",
          },
          objtype: "configuration",
          id: sendgridConfigId,
          title: "SendGrid",
        },
      ],
      notification: {
        created: 1572888002435,
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        id: eventId,
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
                id: emailChannelId,
                providers: [
                  {
                    config: {},
                    key: "sendgrid",
                    configurationId: sendgridConfigId,
                  },
                ],
                taxonomy: "email:sendgrid",
              },
            ],
          },
        },
        objtype: "event",
        tenantId,
        title: "Test Notification",
      },
      extendedProfile: null,
      preferences: {
        categories: {},
        notifications: {},
      },
      profile: {
        email: "engineering@courier.com",
      },
      recipientId: "recipient-id",
      sentProfile: {
        email: "engineering@courier.com",
      },
    },
  },
});

export const pushEvent = sqsEvent({
  messageId: "1-4707e599cf0d485490a0c0faffb5bdb5",
  tenantId,
  type: "route",
  messageLocation: {
    type: "JSON",
    path: {
      data: {},
      eventId,
      override: {
        channel: overrideChannel,
      },
      configurations: [
        {
          creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
          tenantId,
          created: 1572888001972,
          json: {
            appId: "MockAppId",
            key: "MockKey",
            secret: "MockSecret",
            cluster: "MockCluster",
            useTLS: true,
            provider: "pusher",
          },
          objtype: "configuration",
          id: pushConfigId,
          title: "Pusher",
        },
      ],
      notification: {
        created: 1572888002435,
        creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
        id: eventId,
        json: {
          blocks: [],
          channels: {
            always: [],
            bestOf: [
              {
                blockIds: [],
                config: {
                  push: {
                    title: "Push Title",
                  },
                },
                id: pushChannelId,
                providers: [
                  {
                    config: {},
                    key: "pusher",
                    configurationId: pushConfigId,
                  },
                ],
                taxonomy: "push:*",
              },
            ],
          },
        },
        objtype: "event",
        tenantId,
        title: "Test Notification Pusher",
      },
      extendedProfile: null,
      preferences: {
        categories: {},
        notifications: {},
      },
      profile: {
        email: "engineering@courier.com",
        pusher: {
          channel: "pusher-channel",
        },
      },
      recipientId: "recipient-id",
      sentProfile: {
        email: "engineering@courier.com",
      },
    },
  },
});
