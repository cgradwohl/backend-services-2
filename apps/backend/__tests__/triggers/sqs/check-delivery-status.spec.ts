import { get as getConfigurationSpy } from "~/lib/configurations-service";
import * as eventLogs from "~/lib/dynamo/event-logs";
import mockRetryMessage from "~/lib/dynamo/retry-message-v2";
import enqueueMessage from "~/lib/enqueue";
import mockJsonStore from "~/lib/s3";
import { handle } from "~/triggers/sqs/check-delivery-status";

const mockS3Put = (mockJsonStore as jest.Mock)().put;

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/configurations-service", () => {
  return {
    get: jest.fn(),
  };
});

jest.mock("~/lib/dynamo/event-logs", () => {
  return {
    createDeliveredEvent: jest.fn(),
    createPollingAttemptEvent: jest.fn(),
    createPollingErrorEvent: jest.fn(),
    createUndeliverableEvent: jest.fn(),
  };
});

jest.mock("~/lib/dynamo/retry-message-v2");
jest.mock("~/lib/get-environment-variable");

jest.mock("~/lib/enqueue", () => {
  const enqueue = jest.fn();
  return jest.fn(() => enqueue);
});

jest.mock("~/lib/log");

jest.mock("~/lib/s3", () => {
  const put = jest.fn();
  const get = jest.fn();

  return jest.fn(() => ({
    get,
    put,
  }));
});

jest.mock("~/providers", () => {
  return {
    mailgun: {
      deliveryStatusStrategy: "POLLING",
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "SENT",
      }),
      getDeliveryStatusEnabled: () => true,
      getExternalId: () => "an-external-id",
    },
    mailgunSucks: {
      deliveryStatusStrategy: "POLLING",
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "SENT",
      }),
      getDeliveryStatusEnabled: () => true,
      getExternalId: () => "",
    },
    mailjet: {
      deliveryStatusStrategy: "POLLING",
      getDeliveryStatus: jest.fn().mockResolvedValue({
        response: { reason: "Our reason is noble and just." },
        status: "SENT_NO_RETRY",
      }),
      getDeliveryStatusEnabled: () => true,
      getExternalId: () => "an-external-id",
    },
    mandrill: {
      deliveryStatusStrategy: "POLLING",
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "SENT",
      }),
      getDeliveryStatusEnabled: () => false,
      getExternalId: () => "an-external-id",
    },
    postmark: {
      deliveryStatusStrategy: "POLLING",
      getDeliveryStatus: jest.fn().mockResolvedValue({
        reason: "BOUNCED",
        reasonCode: "HARD",
        reasonDetails: "You goofed",
        status: "UNDELIVERABLE",
      }),
      getDeliveryStatusEnabled: () => true,
      getExternalId: () => "an-external-id",
    },
    sendgrid: {
      deliveryStatusStrategy: "POLLING",
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: "DELIVERED",
      }),
      getDeliveryStatusEnabled: () => true,
      getExternalId: () => "an-external-id",
    },
    sparkpost: {
      deliveryStatusStrategy: "POLLING",
      getDeliveryStatus: jest.fn().mockResolvedValue({
        response: { ttl: 1482363487 },
        status: "SENT",
      }),
      getDeliveryStatusEnabled: () => true,
      getExternalId: () => "an-external-id",
    },
    twilio: {
      deliveryStatusStrategy: "WEBHOOK",
      getDeliveryStatusEnabled: () => true,
      getExternalId: () => "an-external-id",
    },
  };
});

const mockCreateDeliveredEvent = eventLogs.createDeliveredEvent as jest.Mock;
const mockCreatePollingAttemptEvent =
  eventLogs.createPollingAttemptEvent as jest.Mock;
const mockCreatePollingErrorEvent =
  eventLogs.createPollingErrorEvent as jest.Mock;
const mockCreateUndeliverableEvent =
  eventLogs.createUndeliverableEvent as jest.Mock;

const createEvent = (body: any) => ({
  Records: [
    {
      attributes: {
        ApproximateFirstReceiveTimestamp: "1578067191001",
        ApproximateReceiveCount: "1",
        SenderId: "AROAZEVQJGIN722LDCLYQ:backend-dev-ApiSend",
        SentTimestamp: "1578067190993",
      },
      awsRegion: "us-east-1",
      body: JSON.stringify(body),
      eventSource: "aws:sqs",
      eventSourceARN:
        "arn:aws:sqs:us-east-1:628508668443:SqsCheckDeliveryStatus",
      md5OfBody: "87464d97c49b6b676e41a40bc07b425c",
      messageAttributes: {},
      messageId: "70aab895-346d-4414-bbda-e352cfeffc29",

      receiptHandle: "AQEBscLJ1Aebsid5/o4ouytxH6Bh...",
    },
  ],
});

const baseBody = {
  channel: { id: "a-channel-id", label: "a-label", taxnomy: "email:*" },
  configuration: "a-configuration-id",
  messageId: "a-message-id",
  messageLocation: {
    path: { providerResponse: {} },
    type: "JSON",
  },
  tenantId: "a-tenant-id",
};

const DateNow = Date.now;

describe("when checking message status", () => {
  let enqueueMock: jest.Mock;
  beforeAll(() => {
    enqueueMock = (enqueueMessage as jest.Mock)();
  });

  afterEach(() => {
    jest.clearAllMocks();
    Date.now = DateNow;
  });

  describe("when receiving a legacy message", () => {
    it("will convert it into a new one", async () => {
      const legacyBody = {
        channel: { id: "a-channel-id", label: "a-label", taxnomy: "email:*" },
        configuration: "a-configuration-id",
        messageId: "a-message-id",
        providerResponse: { stuff: "yeah" },
        tenantId: "a-tenant-id",
      };

      const body = {
        ...legacyBody,
        provider: "sendgrid",
      };

      await handle(createEvent(body));
      expect(mockS3Put.mock.calls[0][0]).toBe(
        "a-tenant-id/delivery_status_a-message-id.json"
      );
      expect(mockS3Put.mock.calls[0][1]).toStrictEqual({
        providerResponse: { stuff: "yeah" },
      });
    });
  });

  it("will return early if external ID is not there", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "mailgunSucks",
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(0);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(0);
  });

  it("will create polling error event if the configuration is not found", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue(null);

    const body = {
      ...baseBody,
      provider: "sendgrid",
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(1);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(1);

    expect(mockCreatePollingErrorEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][2]).toBe(
      "Unable to find configuration"
    );
    expect(mockCreatePollingErrorEvent.mock.calls[0][3]).toBe("sendgrid");

    expect((getConfigurationSpy as jest.Mock).mock.calls.length).toBe(1);
    expect((getConfigurationSpy as jest.Mock).mock.calls[0][0]).toStrictEqual({
      id: body.configuration,
      tenantId: body.tenantId,
    });
  });

  it("will create polling error event if the provider is unknown", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "I'm fake!",
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(1);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(1);

    expect(mockCreatePollingErrorEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][2]).toBe(
      "Unknown Provider I'm fake!"
    );
    expect(mockCreatePollingErrorEvent.mock.calls[0][3]).toBe("I'm fake!");
  });

  it("will retry message if retry count is at eleven", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "I'm fake!",
      retryCount: 11,
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(1);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(1);

    expect(mockCreatePollingErrorEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][2]).toBe(
      "Unknown Provider I'm fake!"
    );
    expect(mockCreatePollingErrorEvent.mock.calls[0][3]).toBe("I'm fake!");
  });

  it("will do nothing if retry count is at 26", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "I'm fake!",
      retryCount: 26,
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(1);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);

    expect(mockCreatePollingErrorEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][2]).toBe(
      "Unknown Provider I'm fake!"
    );
    expect(mockCreatePollingErrorEvent.mock.calls[0][3]).toBe("I'm fake!");
  });

  // It will shorcut out of the entire check and no new events will result
  it("will do nothing if the provider has delivery status disabled", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "mandrill",
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(0);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(0);
  });

  it("will create polling error event if the provider does not support polling for message status", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "twilio",
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(1);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(1);

    expect(mockCreatePollingErrorEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][2]).toContain(
      "Provider twilio does not"
    );
    expect(mockCreatePollingErrorEvent.mock.calls[0][3]).toBe("twilio");
  });

  it("will create delivered event if get message status is DELIEVERED", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "sendgrid",
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(1);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(0);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(0);

    expect(mockCreateDeliveredEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreateDeliveredEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreateDeliveredEvent.mock.calls[0][2]).toBe("sendgrid");
    expect(mockCreateDeliveredEvent.mock.calls[0][3]).toBe(body.configuration);
    expect(mockCreateDeliveredEvent.mock.calls[0][5]).toStrictEqual(
      body.channel
    );
  });

  it("will create undelivered event if get message status is UNDELIEVERED", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "postmark",
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(0);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(1);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(0);

    expect(mockCreateUndeliverableEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreateUndeliverableEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreateUndeliverableEvent.mock.calls[0][2]).toBe("BOUNCED");
    expect(mockCreateUndeliverableEvent.mock.calls[0][3]).toContain(
      "You goofed"
    );
    expect(mockCreateUndeliverableEvent.mock.calls[0][4]).toStrictEqual({
      channel: body.channel,
      deliveryStatusCheckFailed: true,
      provider: "postmark",
      reasonCode: "HARD",
    });
  });

  it("will create polling attempt event and create item if get message status is SENT and the provider has a TTL", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "sparkpost",
      retryCount: 2,
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(1);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(0);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(1);
    expect(enqueueMock.mock.calls.length).toBe(0);

    expect((mockRetryMessage as jest.Mock).mock.calls[0][0]).toStrictEqual({
      ...baseBody,
      provider: "sparkpost",
      retryCount: 3,
      ttl: 1482363487,
    });

    expect(mockCreatePollingAttemptEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreatePollingAttemptEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreatePollingAttemptEvent.mock.calls[0][2]).toBe("sparkpost");
    expect(mockCreatePollingAttemptEvent.mock.calls[0][3]).toBe(3);
    expect(mockCreatePollingAttemptEvent.mock.calls[0][4]).toBeUndefined();
    expect(mockCreatePollingAttemptEvent.mock.calls[0][5]).toBe(1482363487);
  });

  it("will create polling attempt event and create item if get message status is SENT_NO_RETRY", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "mailjet",
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(1);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(0);

    expect(mockCreatePollingErrorEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreatePollingErrorEvent.mock.calls[0][2]).toBe(
      "Our reason is noble and just."
    );
    expect(mockCreatePollingErrorEvent.mock.calls[0][3]).toBe("mailjet");
  });

  it("will create polling attempt event and create item if get message status is SENT and retry count >= 10", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "mailgun",
      retryCount: 10,
    };
    Date.now = jest.fn(() => 1482363367071);

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(1);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(0);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(1);
    expect(enqueueMock.mock.calls.length).toBe(0);

    expect((mockRetryMessage as jest.Mock).mock.calls[0][0]).toStrictEqual({
      ...baseBody,
      provider: "mailgun",
      retryCount: 11,
      ttl: 1482366967,
    });

    expect(mockCreatePollingAttemptEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreatePollingAttemptEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreatePollingAttemptEvent.mock.calls[0][2]).toBe("mailgun");
    expect(mockCreatePollingAttemptEvent.mock.calls[0][3]).toBe(11);
    expect(mockCreatePollingAttemptEvent.mock.calls[0][4]).toBeUndefined();
    expect(mockCreatePollingAttemptEvent.mock.calls[0][5]).toBe(1482366967);
  });

  it("will create polling attempt event and enqueue if get message status is SENT and retry count < 10", async () => {
    (getConfigurationSpy as jest.Mock).mockReturnValue({ json: {} });

    const body = {
      ...baseBody,
      provider: "mailgun",
      retryCount: 2,
    };

    await handle(createEvent(body));

    expect(mockCreateDeliveredEvent.mock.calls.length).toBe(0);
    expect(mockCreatePollingAttemptEvent.mock.calls.length).toBe(1);
    expect(mockCreatePollingErrorEvent.mock.calls.length).toBe(0);
    expect(mockCreateUndeliverableEvent.mock.calls.length).toBe(0);
    expect((mockRetryMessage as jest.Mock).mock.calls.length).toBe(0);
    expect(enqueueMock.mock.calls.length).toBe(1);

    expect(enqueueMock.mock.calls[0][0]).toEqual({
      ...baseBody,
      provider: "mailgun",
      retryCount: 3,
    });

    expect(mockCreatePollingAttemptEvent.mock.calls[0][0]).toBe(body.tenantId);
    expect(mockCreatePollingAttemptEvent.mock.calls[0][1]).toBe(body.messageId);
    expect(mockCreatePollingAttemptEvent.mock.calls[0][2]).toBe("mailgun");
    expect(mockCreatePollingAttemptEvent.mock.calls[0][3]).toBe(3);
    expect(mockCreatePollingAttemptEvent.mock.calls[0][4]).toBeUndefined();
    expect(mockCreatePollingAttemptEvent.mock.calls[0][5]).toBeUndefined();
  });
});
