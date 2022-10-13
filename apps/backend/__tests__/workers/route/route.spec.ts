import { SQS } from "aws-sdk";
import * as eventLogs from "~/lib/dynamo/event-logs";
import mockRetryMessage from "~/lib/dynamo/retry-message-v2";
import * as applyBrand from "~/lib/notifications/apply-brand";
import * as trackingDomains from "~/lib/tracking-domains";
import * as trackingService from "~/lib/tracking-service";
import providerSendHandlers from "~/providers/send-handlers";

import { handleRecord as handle } from "~/workers/route";

import fixtures from "./__fixtures__";

// required to stub out sentry integration
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/sqs/create-event-handler");

jest.mock("~/lib/tracking-service");
const mockTrackingService = trackingService as any;

jest.mock("~/lib/dynamo/event-logs", () => {
  return {
    createErrorEvent: jest.fn(),
    createRenderedEvent: jest.fn(),
    createRoutedEvent: jest.fn(),
    createProviderAttemptEvent: jest.fn(),
    createSentEvent: jest.fn(),
    createSimulatedEvent: jest.fn(),
    createUndeliverableEvent: jest.fn(),
    createUnroutableEvent: jest.fn(),
  };
});

jest.mock("~/lib/dynamo/retry-message-v2");
jest.mock("~/lib/get-environment-variable");

jest.mock("~/lib/get-environment-variable");

jest.mock("isomorphic-dompurify", () => {
  return {
    sanitize: (input: string, options: any) => input,
  };
});

jest.mock("~/lib/tracking-service/generate-tracking-id", () => ({
  generateTrackingId: () => mockOpenTrackingId,
}));

jest.spyOn(trackingDomains, "getDomainByTenant");
(trackingDomains.getDomainByTenant as any).mockImplementation(() => undefined);

// required for consistent ids in event logs
jest.mock("uuid", () => {
  let value = 1;
  return { v4: () => String(value++) };
});

jest.mock("~/providers", () => {
  return {
    pusher: {
      deliveryStatusStrategy: "POLLING",
      handles: ({ config }) => {
        return config.json.provider === "pusher";
      },
      taxonomy: {
        channel: "push",
      },
    },
    sendgrid: {
      deliveryStatusStrategy: "POLLING",
      handles: ({ profile, config }) => {
        if (!profile.email) {
          return false;
        }

        return config.json.provider === "sendgrid";
      },
      taxonomy: {
        channel: "email",
      },
    },
    twilio: {
      deliveryStatusStrategy: "DELIVER_IMMEDIATELY",
      handles: ({ config }) => {
        return config.json.provider === "twilio";
      },
      taxonomy: {
        channel: "direct_messsage",
      },
    },
  };
});

jest.mock("~/providers/send-handlers", () => {
  return {
    pusher: jest.fn().mockReturnValue({
      status: 202,
    }),
    sendgrid: jest.fn().mockReturnValue({
      status: 202,
    }),
    twilio: jest.fn().mockReturnValue({
      status: 202,
    }),
  };
});

jest.mock("aws-sdk", () => {
  const mockS3Client = {
    createPresignedPost: jest.fn().mockReturnValue({ promise: () => null }),
    getObject: jest.fn().mockReturnValue({ promise: () => null }),
    putObject: jest.fn().mockReturnValue({ promise: () => null }),
  };

  const mockDocumentClient = {
    get: () => {
      return {
        promise: () => {
          return {
            Item: {
              tenantId: "mockTenant",
            },
          };
        },
      };
    },
  };

  const mockSQSClient = {
    getQueueUrl: jest.fn().mockReturnValue({ promise: () => "queue-url" }),
    sendMessage: jest.fn().mockReturnValue({ promise: () => null }),
  };

  // its kinda stupid we have to do this
  // if you trace it thru you will find out that
  // the reason is when we handle errors it references
  // err instanceof MessageErrors.MessageNotFoundError
  return {
    CognitoIdentityServiceProvider: jest.fn(),
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDocumentClient),
    },
    EventBridge: jest.fn(),
    Route53: jest.fn(() => undefined),
    S3: jest.fn(() => mockS3Client),
    SQS: jest.fn(() => mockSQSClient),
    config: {
      update: jest.fn(),
    },
  };
});

const mockOpenTrackingId = "mockOpenTrackingId";

describe("workers/route", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest
      .spyOn(Date.prototype, "getTime")
      .mockImplementation(() => 1578429824243);
  });

  describe("email open tracking", () => {
    it("should fail to call the tracking service when emailOpenTracking is false", async () => {
      await handle(
        fixtures.json.routable.emailOpenTrackingEventFail.Records[0]
      );
      expect(mockTrackingService.saveTrackingRecords.mock.calls.length).toBe(1);
    });

    it("should succeed to call the tracking service when emailOpenTracking is true", async () => {
      await handle(
        fixtures.json.routable.emailOpenTrackingEventSucceed.Records[0]
      );
      expect(mockTrackingService.saveTrackingRecords.mock.calls.length).toBe(1);
    });
  });

  describe("routable sent event", () => {
    beforeEach(async () => {
      await handle(fixtures.json.routable.event.Records[0]);
    });

    it("should createRenderedEvent the template", () => {
      const mockRendered = (eventLogs.createRenderedEvent as jest.Mock).mock;

      expect(mockRendered.calls.length).toBe(1);
      expect(mockRendered.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        "sendgrid",
        "95f7c347-9b23-4099-8f0d-28aa80e72178",
        {
          id: "95f7c347-9b23-4099-8f0d-28aa80e72178",
          label: undefined,
          taxonomy: "email:sendgrid",
        },
        {},
        undefined,
        undefined,
      ]);
    });

    it("should send the message", () => {
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls.length
      ).toBe(1);
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config: {
          apiKey: "SuperSecretApiKey",
          provider: "sendgrid",
        },
        sentProfile: {
          email: "engineering@courier.com",
        },
      });
    });

    it("should mark the message sent", () => {
      expect(
        (eventLogs.createSentEvent as jest.Mock).mock.calls[0]
      ).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        "sendgrid",
        "95f7c347-9b23-4099-8f0d-28aa80e72178",
        { status: 202 },
        {
          id: "95f7c347-9b23-4099-8f0d-28aa80e72178",
          label: undefined,
          taxonomy: "email:sendgrid",
        },
      ]);
    });

    it("should create an open tracking record", () => {
      expect(mockTrackingService.saveTrackingRecords.mock.calls.length).toBe(1);
      expect(
        mockTrackingService.saveTrackingRecords.mock.calls[0][0][0].trackingId
      ).toBe(mockOpenTrackingId);
    });
  });

  describe("null-routed sent event", () => {
    beforeEach(async () => {
      await handle(fixtures.json.routable.mockRouted.Records[0]);
    });

    it("should createRenderedEvent the template", () => {
      const mockRendered = (eventLogs.createRenderedEvent as jest.Mock).mock;

      expect(mockRendered.calls.length).toBe(1);
      expect(mockRendered.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        "sendgrid",
        "95f7c347-9b23-4099-8f0d-28aa80e72178",
        {
          id: "95f7c347-9b23-4099-8f0d-28aa80e72178",
          label: undefined,
          taxonomy: "email:sendgrid",
        },
        {},
        undefined,
        undefined,
      ]);
    });

    it("should createRoutedEvent the template", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;

      expect(mockRouted.calls.length).toBe(1);
      expect(mockRouted.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        {
          channelsSummary: [
            {
              channel: "email",
              reason: undefined,
              selected: true,
            },
          ],
          preferences: {
            categories: null,
            notifications: null,
          },
        },
      ]);
    });

    it("should not send the message", () => {
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls.length
      ).toBe(0);
    });

    it("should mark the message simulated", () => {
      expect(
        (eventLogs.createSimulatedEvent as jest.Mock).mock.calls[0]
      ).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        "sendgrid",
        "95f7c347-9b23-4099-8f0d-28aa80e72178",
        { "message-id": "null-routed: success" },
        {
          id: "95f7c347-9b23-4099-8f0d-28aa80e72178",
          label: undefined,
          taxonomy: "email:sendgrid",
        },
      ]);
    });

    it("should not create an open tracking record", () => {
      expect(mockTrackingService.saveTrackingRecords.mock.calls.length).toBe(1);
    });
  });

  describe("routable delivered event", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    beforeEach(async () => {
      await handle(fixtures.json.routable.twilioEvent.Records[0]);
    });

    it("should render the template", () => {
      const mock = (eventLogs.createRenderedEvent as jest.Mock).mock;
      expect(mock.calls.length).toBe(1);
      expect(mock.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        "twilio",
        "95f7c347-9b23-4099-8f0d-28aa80e72178",
        {
          id: "95f7c347-9b23-4099-8f0d-28aa80e72178",
          label: undefined,
          taxonomy: "direct_message:sms:twilio",
        },
        {},
        undefined,
        undefined,
      ]);
    });

    it("should createRoutedEvent the template", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;

      expect(mockRouted.calls.length).toBe(1);
      expect(mockRouted.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        {
          channelsSummary: [
            {
              channel: "sms",
              reason: undefined,
              selected: true,
            },
          ],
          preferences: {
            categories: null,
            notifications: null,
          },
        },
      ]);
    });

    it("should send the message", () => {
      expect((providerSendHandlers.twilio as jest.Mock).mock.calls.length).toBe(
        1
      );
      expect(
        (providerSendHandlers.twilio as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config: {
          apiKey: "SuperSecretApiKey",
          provider: "twilio",
        },
        sentProfile: {
          email: "engineering@courier.com",
        },
      });
    });

    it("should mark the message sent", () => {
      expect((eventLogs.createSentEvent as jest.Mock).mock.calls.length).toBe(
        1
      );
      expect(
        (eventLogs.createSentEvent as jest.Mock).mock.calls[0]
      ).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        "twilio",
        "95f7c347-9b23-4099-8f0d-28aa80e72178",
        { status: 202 },
        {
          id: "95f7c347-9b23-4099-8f0d-28aa80e72178",
          label: undefined,
          taxonomy: "direct_message:sms:twilio",
        },
      ]);
    });
  });

  describe("preferences disabled by category", () => {
    it("should create undeliverable event", async () => {
      await handle(fixtures.json.preferencesCategoryDisabled.event.Records[0]);
      expect(
        (eventLogs.createUndeliverableEvent as jest.Mock).mock.calls[0]
      ).toMatchObject([
        fixtures.json.preferencesCategoryDisabled.tenantId,
        fixtures.json.preferencesCategoryDisabled.messageId,
        "UNSUBSCRIBED",
        "Category, Mock Category, opted out by user",
        {
          preferences: {
            categories: {
              "15": {
                status: "OPTED_OUT",
              },
            },
            notifications: {},
          },
        },
      ]);
    });

    it("should NOT createRoutedEvent", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;
      expect(mockRouted.calls.length).toBe(0);
    });
  });

  describe("preferences disabled by notification", () => {
    it("notification - should create undeliverable event", async () => {
      await handle(
        fixtures.json.preferencesNotificationDisabled.event.Records[0]
      );
      expect(
        (eventLogs.createUndeliverableEvent as jest.Mock).mock.calls[0]
      ).toMatchObject([
        fixtures.json.preferencesNotificationDisabled.tenantId,
        fixtures.json.preferencesNotificationDisabled.messageId,
        "UNSUBSCRIBED",
        "Notification opted out by user",
        {
          preferences: {
            categories: {
              "22": {},
            },
            notifications: {
              "23": {
                status: "OPTED_OUT",
              },
            },
          },
        },
      ]);
    });

    it("should NOT createRoutedEvent", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;
      expect(mockRouted.calls.length).toBe(0);
    });
  });

  describe("preferences required by notification", () => {
    it("notification - should send a notification even if its disabled", async () => {
      await handle(
        fixtures.json.preferencesNotificationRequired.event.Records[0]
      );
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls.length
      ).toBe(1);
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config:
          fixtures.json.preferencesNotificationRequired.sendgridConfig.json,
        sentProfile: {
          email: "engineering@courier.com",
        },
      });
    });
  });

  describe("preferences required by category", () => {
    it("category - should send a the notification even if its disabled", async () => {
      await handle(fixtures.json.preferencesCategoryRequired.event.Records[0]);
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls.length
      ).toBe(1);
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config: fixtures.json.preferencesCategoryRequired.sendgridConfig.json,
        sentProfile: {
          email: "engineering@courier.com",
        },
      });
    });
  });

  describe("filtered channel", () => {
    beforeEach(async () => {
      await handle(fixtures.json.filteredChannel.event.Records[0]);
    });

    it("should send the message to the non filtered channel", () => {
      expect((providerSendHandlers.twilio as jest.Mock).mock.calls.length).toBe(
        1
      );
      expect(
        (providerSendHandlers.twilio as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config: fixtures.json.filteredChannel.twilioConfig.json,
        sentProfile: {
          email: "engineering@courier.com",
        },
      });
    });

    it("should createRoutedEvent the template", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;

      expect(mockRouted.calls.length).toBe(1);
      expect(mockRouted.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        {
          channelsSummary: [
            {
              channel: "email",
              conditional: {
                filters: [
                  {
                    operator: "EQUALS",
                    property: "email",
                    source: "profile",
                    value: "engineering@courier.com",
                  },
                ],
                logicalOperator: "and",
              },
              reason: "FILTERED_OUT_AT_CHANNEL",
              selected: false,
            },
            {
              channel: "sms",
              reason: undefined,
              selected: true,
            },
          ],
          preferences: {
            categories: null,
            notifications: null,
          },
        },
      ]);
    });
  });

  describe("filtered channel - show", () => {
    beforeEach(async () => {
      await handle(fixtures.json.filteredChannelShow.event.Records[0]);
    });

    it("should send the message to the enabled channel", () => {
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls.length
      ).toBe(1);
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config: fixtures.json.filteredChannelShow.sendgridConfig.json,
        sentProfile: {
          email: "engineering@courier.com",
        },
      });
    });

    it("should createRoutedEvent the template", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;

      expect(mockRouted.calls.length).toBe(1);
      expect(mockRouted.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        {
          channelsSummary: [
            {
              channel: "email",
              reason: undefined,
              selected: true,
            },
          ],
          preferences: {
            categories: null,
            notifications: null,
          },
        },
      ]);
    });
  });

  describe("filtered provider", () => {
    beforeEach(async () => {
      await handle(fixtures.json.filteredProvider.event.Records[0]);
    });

    it("should send the message to the non filtered channel", () => {
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls.length
      ).toBe(1);
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config: fixtures.json.filteredProvider.sendgridConfig2.json,
        sentProfile: {
          email: "engineering@courier.com",
        },
      });
    });

    it("should createRoutedEvent the template", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;

      expect(mockRouted.calls.length).toBe(1);
      expect(mockRouted.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        {
          channelsSummary: [
            {
              channel: "email",
              reason: "FILTERED_AT_PROVIDER",
              selected: false,
            },
            {
              channel: "email",
              reason: undefined,
              selected: true,
            },
          ],
          preferences: {
            categories: null,
            notifications: null,
          },
        },
      ]);
    });
  });

  describe("filtered provider - show", () => {
    beforeEach(async () => {
      await handle(fixtures.json.filteredProviderShow.event.Records[0]);
    });

    it("should send the message to the chosen channel", () => {
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls.length
      ).toBe(1);
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config: fixtures.json.filteredProviderShow.sendgridConfig.json,
        sentProfile: {
          email: "engineering@courier.com",
        },
      });
    });

    it("should createRoutedEvent the template", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;

      expect(mockRouted.calls.length).toBe(1);
      expect(mockRouted.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        {
          channelsSummary: [
            {
              channel: "email",
              reason: undefined,
              selected: true,
            },
            {
              channel: "email",
              reason: undefined,
              selected: true,
            },
          ],
          preferences: {
            categories: null,
            notifications: null,
          },
        },
      ]);
    });
  });

  describe("filtered provider - show - choose second", () => {
    beforeEach(async () => {
      await handle(fixtures.json.filteredProviderShowSecond.event.Records[0]);
    });

    it("should createRoutedEvent the template", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;

      expect(mockRouted.calls.length).toBe(1);
      expect(mockRouted.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        {
          channelsSummary: [
            {
              channel: "email",
              reason: "FILTERED_AT_PROVIDER",
              selected: false,
            },
            {
              channel: "email",
              reason: undefined,
              selected: true,
            },
          ],
          preferences: {
            categories: null,
            notifications: null,
          },
        },
      ]);
    });

    it("should filter down to the second provider within the channel", () => {
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls.length
      ).toBe(1);
      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config: fixtures.json.filteredProviderShow.sendgridConfig2.json,
        sentProfile: {
          email: "engineerin@courier.com",
        },
      });
    });
  });

  describe("disabled channel", () => {
    beforeEach(async () => {
      await handle(fixtures.json.disabledChannel.event.Records[0]);
    });

    it("should createRoutedEvent the template", () => {
      const mockRouted = (eventLogs.createRoutedEvent as jest.Mock).mock;

      expect(mockRouted.calls.length).toBe(1);
      expect(mockRouted.calls[0]).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        {
          channelsSummary: [
            {
              channel: "email",
              reason: "CHANNEL_DISABLED",
              selected: false,
            },
            {
              channel: "sms",
              reason: undefined,
              selected: true,
            },
          ],
          preferences: {
            categories: null,
            notifications: null,
          },
        },
      ]);
    });

    it("should send the message to the non filtered channel", () => {
      expect((providerSendHandlers.twilio as jest.Mock).mock.calls.length).toBe(
        1
      );
      expect(
        (providerSendHandlers.twilio as jest.Mock).mock.calls[0][0]
      ).toMatchObject({
        config: fixtures.json.disabledChannel.twilioConfig.json,
        sentProfile: {
          email: "engineering@courier.com",
        },
      });
    });
  });

  describe("invalid delivery channel", () => {
    it("should gracefully exit when a valid always channel exists", async () => {
      await handle(fixtures.json.alwaysWithoutBestOf.event.Records[0]);
      expect((providerSendHandlers.twilio as jest.Mock).mock.calls.length).toBe(
        0
      );
    });

    it("should throw an error when neither bestOf or always are routable", async () => {
      await handle(fixtures.json.noValidDeliveryChannel.event.Records[0]);

      expect(
        (eventLogs.createUnroutableEvent as jest.Mock).mock.calls[0]
      ).toMatchObject([
        "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
        "1-4707e599cf0d485490a0c0faffb5bdb5",
        "NO_CHANNELS",
        "No Valid Delivery Channel",
      ]);
    });
  });

  describe("if error is Internal Courier Error and no retries", () => {
    beforeEach(async () => {
      (providerSendHandlers.sendgrid as jest.Mock).mockRejectedValue(
        new Error()
      );
      await handle(fixtures.json.routable.event.Records[0]);
    });

    it("will enqueue to route if ttl is falsey", async () => {
      expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(1);
      expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);

      const messageBody = JSON.parse(
        (SQS as any as jest.Mock)().sendMessage.mock.calls[0][0].MessageBody
      );
      const expected = JSON.parse(fixtures.json.routable.event.Records[0].body);
      expect(messageBody).toMatchObject({ ...expected, retryCount: 1 });
    });
  });

  describe("if error is Internal Courier Error and eleven retries", () => {
    beforeEach(async () => {
      (providerSendHandlers.sendgrid as jest.Mock).mockRejectedValue(
        new Error()
      );
      await handle(fixtures.json.routable.eventWithElevenRetries.Records[0]);
    });

    it("will retry message if retry count <= 25", async () => {
      expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(0);
      expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(1);

      const messageBody = (mockRetryMessage as jest.Mock).mock.calls[0][0];
      expect(messageBody).toMatchObject({
        messageId: "1-5e0f64f5-01f25aca9d89333c7eeaee16",
        messageLocation: {
          path: {
            recipientId: "recipient-id",
          },
          type: "JSON",
        },
        retryCount: 12,
        tenantId: "9651ef0b-ed3c-436a-a7fd-b9e2adf9846d",
      });
    });
  });

  describe("if error is Internal Courier Error and 26 retries", () => {
    beforeEach(async () => {
      (providerSendHandlers.sendgrid as jest.Mock).mockRejectedValue(
        new Error()
      );
      await handle(fixtures.json.routable.eventWith26Retries.Records[0]);
    });

    it("will do nothing if retry count >= 26", async () => {
      expect((SQS as any as jest.Mock)().sendMessage.mock.calls.length).toBe(0);
      expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);
    });
  });

  describe("can override brand", () => {
    const applyBrandSpy = jest.spyOn(applyBrand, "default");

    afterEach(() => {
      jest.clearAllMocks();
    });

    beforeEach(async () => {
      await handle(fixtures.json.brandOverride.event.Records[0]);
    });

    it("should apply overrode brand", () => {
      const appliedBrand = (applyBrandSpy as jest.Mock).mock.calls[0][1];
      expect(appliedBrand.settings.colors).toEqual(
        fixtures.json.brandOverride.overrideBrand.settings.colors
      );
    });
  });

  describe("can override channel - email", () => {
    beforeEach(async () => {
      await handle(fixtures.json.channelOverride.emailEvent.Records[0]);
    });

    it("should apply overrode email channel", () => {
      const templates = (providerSendHandlers.sendgrid as jest.Mock).mock
        .calls[0][1];

      expect(
        (providerSendHandlers.sendgrid as jest.Mock).mock.calls.length
      ).toBe(1);
      expect(templates).toMatchObject(
        fixtures.json.channelOverride.overrideChannel.email
      );
    });
  });

  describe("can override channel - push", () => {
    beforeEach(async () => {
      await handle(fixtures.json.channelOverride.pushEvent.Records[0]);
    });

    it("should apply overrode push channel", () => {
      const templates = (providerSendHandlers.pusher as jest.Mock).mock
        .calls[0][1];

      expect((providerSendHandlers.pusher as jest.Mock).mock.calls.length).toBe(
        1
      );
      expect(templates).toMatchObject(
        fixtures.json.channelOverride.overrideChannel.push
      );
    });
  });
});
