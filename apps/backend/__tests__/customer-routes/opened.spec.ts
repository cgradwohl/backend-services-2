import uuid from "uuid";
import uuidAPIKey from "uuid-apikey";
import {
  handle as handleOpened,
  transparentBase64Gif,
} from "~/client-routes/opened";
import captureException from "~/lib/capture-exception";
import * as dynamoEventLogs from "~/lib/dynamo/event-logs";
import * as dynamoMessages from "~/lib/dynamo/messages";
import * as trackingService from "~/lib/tracking-service";

jest.mock("~/lib/dynamo/messages");
jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/tracking-service");
jest.mock("~/lib/dynamo/event-logs");
jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});
jest.mock("~/lib/taxonomy-helpers", () => {
  return {
    getTaxonomyFromProvider: () => "email:*",
  };
});
jest.mock("~/lib/get-environment-variable");

const dynamoEventLogsMock = dynamoEventLogs as any;
const dynamoMessagesMock = dynamoMessages as any;
const trackingServiceMock = trackingService as any;

const captureExceptionMock = captureException as any;

const mockProvider = "mockProvider";
const mockTenantId = "mockTenantId";
const mockMessageId = "mockMessageId";
const mockTrackingId = uuidAPIKey.toAPIKey(uuid.v4(), { noDashes: true });

const mockChannelId = "mockChannelId";
const mockChannel = {
  id: "",
  taxonomy: "email:*",
};

const mockHeaders = {
  Host: `${mockTenantId}.ct0.app`,
};
const mockIpAddress = "mockIpAddress";
const mockUserAgent = "mockUserAgent";

describe("opened route", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("throw an error without tenantId", async () => {
    await handleOpened(
      {
        headers: mockHeaders,
        identity: { sourceIp: mockIpAddress, userAgent: mockUserAgent },
        path: { openedParam: "" },
      },
      {},
      (error, response) => {
        expect(response).toBe(transparentBase64Gif);
        expect(error).toBe(null);
      }
    );

    expect(String(captureExceptionMock.mock.calls[0][0])).toBe(
      "BadRequestError: Missing tenantId"
    );
  });

  it("throw an error without messageId in dev", async () => {
    await handleOpened(
      {
        headers: mockHeaders,
        identity: { sourceIp: mockIpAddress, userAgent: mockUserAgent },
        path: { openedParam: "mockOpenedParam." },
      },
      {},
      (error, response) => {
        expect(response).toBe(transparentBase64Gif);
        expect(error).toBe(null);
      }
    );

    expect(String(captureExceptionMock.mock.calls[0][0])).toBe(
      "BadRequestError: Missing trackingId"
    );
  });

  it("will create opened event via messageId", async () => {
    dynamoMessagesMock.get.mockImplementation(async () => ({
      provider: mockProvider,
    }));

    process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME = `ct0.app`;

    await handleOpened(
      {
        headers: mockHeaders,
        identity: { sourceIp: mockIpAddress, userAgent: mockUserAgent },
        path: { openedParam: `${mockMessageId}.gif` },
      },
      {},
      (error, response) => {
        expect(error).toBe(null);
        expect(response).toBe(transparentBase64Gif);
      }
    );

    expect(dynamoEventLogsMock.createOpenedEvent.mock.calls[0]).toEqual([
      mockTenantId,
      mockMessageId,
      mockProvider,
      {
        id: undefined,
        taxonomy: "email:*",
      },
      {
        headers: mockHeaders,
        ip: mockIpAddress,
        userAgent: mockUserAgent,
      },
    ]);
  });

  it("will create opened event via trackingId", async () => {
    trackingServiceMock.getTrackingRecord.mockImplementation(async () => ({
      channel: mockChannel,
      channelId: mockChannelId,
      messageId: mockMessageId,
      providerKey: mockProvider,
    }));

    process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME = `ct0.app`;

    await handleOpened(
      {
        headers: mockHeaders,
        identity: { sourceIp: mockIpAddress, userAgent: mockUserAgent },
        path: { openedParam: `${mockTrackingId}.gif` },
      },
      {},
      (error, response) => {
        expect(error).toBe(null);
        expect(response).toBe(transparentBase64Gif);
      }
    );

    expect(dynamoEventLogsMock.createOpenedEvent.mock.calls[0]).toEqual([
      mockTenantId,
      mockMessageId,
      mockProvider,
      {
        id: mockChannelId,
        taxonomy: mockChannel.taxonomy,
      },
      {
        channel: {
          id: "",
          taxonomy: mockChannel.taxonomy,
        },
        channelId: mockChannelId,
        headers: mockHeaders,
        ip: mockIpAddress,
        messageId: mockMessageId,
        providerKey: mockProvider,
        userAgent: mockUserAgent,
      },
    ]);
  });

  it("[frontapp.com] will not mark event opened with ignored user-agent via messageId", async () => {
    const ignoredUserAgent = "FrontApp.com";

    dynamoMessagesMock.get.mockImplementation(async () => ({
      provider: mockProvider,
    }));

    process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME = `ct0.app`;

    await handleOpened(
      {
        headers: mockHeaders,
        identity: { sourceIp: mockIpAddress, userAgent: ignoredUserAgent },
        path: { openedParam: `${mockMessageId}.gif` },
      },
      {},
      (error, response) => {
        expect(error).toBe(null);
        expect(response).toBe(transparentBase64Gif);
      }
    );

    expect(dynamoEventLogsMock.createOpenedEvent.mock.calls.length).toEqual(0);
  });

  it("[frontapp.com] will not mark event opened with ignored user-agent via messageId with sent timestamp", async () => {
    const ignoredUserAgent = "FrontApp.com";

    dynamoMessagesMock.get.mockImplementation(async () => ({
      provider: mockProvider,
      sent: Date.now(),
    }));

    process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME = `ct0.app`;

    await handleOpened(
      {
        headers: mockHeaders,
        identity: { sourceIp: mockIpAddress, userAgent: ignoredUserAgent },
        path: { openedParam: `${mockMessageId}.gif` },
      },
      {},
      (error, response) => {
        expect(error).toBe(null);
        expect(response).toBe(transparentBase64Gif);
      }
    );

    expect(dynamoEventLogsMock.createOpenedEvent.mock.calls.length).toEqual(0);
  });

  const allowedGoogleOpenSeconds = 21 * 1000;
  it(`[google image proxy] will mark event opened with time-sensitive ignored user-agent via messageId (${allowedGoogleOpenSeconds} ms)`, async () => {
    const ignoredUserAgent = "GoogleImageProxy";

    dynamoMessagesMock.get.mockImplementation(async () => ({
      provider: mockProvider,
      sent: +new Date() - allowedGoogleOpenSeconds,
    }));

    process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME = `ct0.app`;

    await handleOpened(
      {
        headers: mockHeaders,
        identity: { sourceIp: mockIpAddress, userAgent: ignoredUserAgent },
        path: { openedParam: `${mockMessageId}.gif` },
      },
      {},
      (error, response) => {
        expect(error).toBe(null);
        expect(response).toBe(transparentBase64Gif);
      }
    );

    expect(dynamoEventLogsMock.createOpenedEvent.mock.calls.length).toEqual(1);
  });

  const blockedGoogleOpenSeconds = 5 * 1000;
  it(`[google image proxy] will not mark event opened with time-sensitive ignored user-agent via messageId (${blockedGoogleOpenSeconds} ms)`, async () => {
    const ignoredUserAgent = "GoogleImageProxy";

    dynamoMessagesMock.get.mockImplementation(async () => ({
      provider: mockProvider,
      sent: +new Date() - blockedGoogleOpenSeconds,
    }));

    process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME = `ct0.app`;

    await handleOpened(
      {
        headers: mockHeaders,
        identity: { sourceIp: mockIpAddress, userAgent: ignoredUserAgent },
        path: { openedParam: `${mockMessageId}.gif` },
      },
      {},
      (error, response) => {
        expect(error).toBe(null);
        expect(response).toBe(transparentBase64Gif);
      }
    );

    expect(dynamoEventLogsMock.createOpenedEvent.mock.calls.length).toEqual(0);
  });

  it(`[google image proxy] will mark event opened with time-sensitive ignored user-agent via messageId and no sent timestamp`, async () => {
    const ignoredUserAgent = "GoogleImageProxy";

    dynamoMessagesMock.get.mockImplementation(async () => ({
      provider: mockProvider,
      sent: null,
    }));

    process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME = `ct0.app`;

    await handleOpened(
      {
        headers: mockHeaders,
        identity: { sourceIp: mockIpAddress, userAgent: ignoredUserAgent },
        path: { openedParam: `${mockMessageId}.gif` },
      },
      {},
      (error, response) => {
        expect(error).toBe(null);
        expect(response).toBe(transparentBase64Gif);
      }
    );

    expect(dynamoEventLogsMock.createOpenedEvent.mock.calls.length).toEqual(1);
  });

  it("[https://app.courier.com/] will not mark event opened with ignored referer via messageId with sent timestamp", async () => {
    dynamoMessagesMock.get.mockImplementation(async () => ({
      provider: mockProvider,
      sent: Date.now(),
    }));

    process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME = `ct0.app`;

    await handleOpened(
      {
        headers: {
          ...mockHeaders,
          Referer: "https://app.courier.com/",
        },
        identity: { sourceIp: mockIpAddress, userAgent: mockUserAgent },
        path: { openedParam: `${mockMessageId}.gif` },
      },
      {},
      (error, response) => {
        expect(error).toBe(null);
        expect(response).toBe(transparentBase64Gif);
      }
    );

    expect(dynamoEventLogsMock.createOpenedEvent.mock.calls.length).toEqual(0);
  });

  it("[https://www.trycourier.app/] will not mark event opened with ignored referer via messageId with sent timestamp", async () => {
    dynamoMessagesMock.get.mockImplementation(async () => ({
      provider: mockProvider,
      sent: Date.now(),
    }));

    process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME = `ct0.app`;

    await handleOpened(
      {
        headers: {
          ...mockHeaders,
          Referer: "https://www.trycourier.app/",
        },
        identity: { sourceIp: mockIpAddress, userAgent: mockUserAgent },
        path: { openedParam: `${mockMessageId}.gif` },
      },
      {},
      (error, response) => {
        expect(error).toBe(null);
        expect(response).toBe(transparentBase64Gif);
      }
    );

    expect(dynamoEventLogsMock.createOpenedEvent.mock.calls.length).toEqual(0);
  });
});
