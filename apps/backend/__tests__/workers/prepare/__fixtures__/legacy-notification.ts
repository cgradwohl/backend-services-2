import sqsEvent from "./sqs-event";

export const event = sqsEvent({
  messageId: "1-5e0f64f5-01f25aca9d89333c7eeaee16",
  messageLocation: {
    path: {
      eventData: {},
      eventId: "9JXJ5YX93G42Y8MX6C7BH7XPHEFN",
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
    strategyId: "78bbe2ed-37ad-4780-8d1f-59b289f8f14b",
    emailSubject: "Email Subject",
    emailTemplateConfig: {
      templateName: "line",
      topBarColor: "#58C87A",
      headerLogoAlign: "left",
    },
    blocks: [],
    providers: {
      sendgrid: {
        body: ["block1", "block2"],
      },
      twilio: {
        body: ["block3", "block4"],
      },
    },
  },
  objtype: "event",
  id: "4cbb22fb-48e0-4179-a74c-c3ae3f6d173e",
  title: "Test Notification",
};

export const strategy = {
  creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
  tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  created: 1572888001972,
  json: {
    always: [],
    configurations: [
      "ff16c47a-9f65-418f-8a72-199cbf4e8acc",
      "f1bc996e-2470-422b-8e2b-65e8f165ea9e",
    ],
  },
  objtype: "strategy",
  id: "78bbe2ed-37ad-4780-8d1f-59b289f8f14b",
  title: "Notification Rules",
};
