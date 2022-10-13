import sqsEvent from "./sqs-event";

const getBaseEvent = (
  provider: string,
  taxonomy: string,
  retryCount?: number,
  messageProperties = {}
) =>
  sqsEvent({
    messageId: "1-5e0f64f5-01f25aca9d89333c7eeaee16",
    messageLocation: {
      path: {
        configurations: [
          {
            created: 1572887936895,
            creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
            id: "95f7c347-9b23-4099-8f0d-28aa80e72178",
            json: {
              apiKey: "SuperSecretApiKey",
              provider,
            },
            objtype: "configuration",
            tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
            title: "Default Configuration",
          },
        ],
        event: {
          created: 1572888002435,
          creator: "d994f368-899f-4e0e-85ab-4bc6e914cbfa",
          id: "4cbb22fb-48e0-4179-a74c-c3ae3f6d173e",
          json: {
            blocks: [],
            channels: {
              always: [],
              bestOf: [
                {
                  blockIds: [],
                  config: {
                    email: {
                      emailReplyTo: "support@courier.com",
                      emailSubject: "Test Subject",
                      emailTemplateConfig: {},
                      isUsingTemplateOverride: false,
                    },
                  },
                  id: "95f7c347-9b23-4099-8f0d-28aa80e72178",
                  providers: [
                    {
                      config: {},
                      configurationId: "95f7c347-9b23-4099-8f0d-28aa80e72178",
                    },
                  ],
                  taxonomy,
                },
              ],
            },
          },
          objtype: "event",
          tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
          title: "Test Event",
        },
        extendedProfile: null,
        profile: {
          email: "engineering@courier.com",
        },
        recipientId: "recipient-id",
        sentProfile: {
          email: "engineering@courier.com",
        },
        ...messageProperties,
      },
      type: "JSON",
    },
    retryCount,
    tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
  });

export const event = getBaseEvent("sendgrid", "email:sendgrid");
export const twilioEvent = getBaseEvent("twilio", "direct_message:sms:twilio");
export const eventWithElevenRetries = getBaseEvent(
  "sendgrid",
  "email:sendgrid",
  11
);
export const eventWith26Retries = getBaseEvent(
  "sendgrid",
  "email:sendgrid",
  26
);

export const emailOpenTrackingEventFail = getBaseEvent(
  "sendgrid",
  "email:sendgrid",
  26,
  {
    emailOpenTracking: {
      enabled: false,
    },
  }
);

export const emailOpenTrackingEventSucceed = getBaseEvent(
  "sendgrid",
  "email:sendgrid",
  26,
  {
    emailOpenTracking: {
      enabled: true,
    },
  }
);

export const mockRouted = getBaseEvent(
  "sendgrid",
  "email:sendgrid",
  undefined,
  {
    dryRunKey: "mock",
  }
);
