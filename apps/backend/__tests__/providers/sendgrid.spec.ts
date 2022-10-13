import axios from "axios";

import { replace as mockReplace } from "~/lib/configurations-service";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";

import {
  CheckDeliveryStatusError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";
import getDeliveredTimestamp from "~/providers/sendgrid/get-delivered-timestamp";
import getDeliveryStatus from "~/providers/sendgrid/get-delivery-status";
import getDeliveryStatusEnabled from "~/providers/sendgrid/get-delivery-status-enabled";
import getExternalId from "~/providers/sendgrid/get-external-id";
import getReference from "~/providers/sendgrid/get-reference";
import send from "~/providers/sendgrid/send";
import { DeliveryHandlerParams } from "~/providers/types";

import getConfiguration from "./__fixtures__/get-configuration";

const axiosSpy = axios as any as jest.Mock;

const sendSpy = jest.fn();

jest.mock("axios");
jest.mock("@sendgrid/mail", () => {
  return {
    MailService: jest.fn(() => ({
      send: sendSpy,
      setApiKey: jest.fn(),
      setTimeout: jest.fn(),
    })),
  };
});

jest.mock("~/lib/configurations-service", () => {
  return {
    replace: jest.fn(),
  };
});

const serverErrors: ReadonlyArray<number> = [
  500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511, 599,
];

const createDeliveryParams = (
  config?: any,
  body: any = { profile: { email: "support@courier.app" } }
): DeliveryHandlerParams => {
  const variableData = {
    event: "",
    recipient: "",
    ...body,
  };
  const variableHandler = createVariableHandler({ value: variableData });
  const linkHandler = createLinkHandler({});

  return {
    config: {
      ...config,
      provider: "sendgrid",
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

const EXTERNAL_ID = "an-external-id";
const TENANT_ID = "a-tenant-id";
const API_KEY = "an-api-key";
const CONFIGURATION = {
  id: "a-configurtion-id",
  json: { apiKey: API_KEY },
} as any;

describe("when sending an email", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const deliveryParams = createDeliveryParams({
    apiKey: API_KEY,
    fromAddress: "support@courier.app",
  });

  const retryableStatuses = [400, 401, 403, 406, 415, 429].concat(serverErrors);
  for (const status of retryableStatuses) {
    it(`will throw RetryableProviderResponseError if status is ${status}`, async () => {
      sendSpy.mockRejectedValue({ response: { status } });

      await expect(send(deliveryParams, {})).rejects.toBeInstanceOf(
        RetryableProviderResponseError
      );
    });

    it(`will throw RetryableProviderResponseError if code is ${status}`, async () => {
      sendSpy.mockRejectedValue({ code: status });

      await expect(send(deliveryParams, {})).rejects.toBeInstanceOf(
        RetryableProviderResponseError
      );
    });
  }

  it(`will throw ProviderResponseError if status is 413`, async () => {
    sendSpy.mockRejectedValue({ response: { status: 413 } });

    await expect(send(deliveryParams, {})).rejects.toBeInstanceOf(
      ProviderResponseError
    );
  });

  it(`will throw ProviderResponseError if code is 413`, async () => {
    sendSpy.mockRejectedValue({ code: 413 });

    await expect(send(deliveryParams, {})).rejects.toBeInstanceOf(
      ProviderResponseError
    );
  });
});

describe("when getting delivery status", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("will throw if it can't find an apiKey", async () => {
    await expect(
      getDeliveryStatus(
        EXTERNAL_ID,
        { json: { notApiKey: "something" } } as any,
        TENANT_ID
      )
    ).rejects.toBeInstanceOf(CheckDeliveryStatusError);

    expect(axiosSpy.mock.calls.length).toBe(0);
    expect((mockReplace as jest.Mock).mock.calls.length).toBe(0);
  });

  it("will return SENT if the API returns no messages", async () => {
    Date.now = jest.fn(() => 1482363367071);

    axiosSpy.mockResolvedValue({
      data: { messages: [] },
    });

    const result = await getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("SENT");

    expect(axiosSpy.mock.calls[0][0]).toMatchObject({
      baseURL: "https://api.sendgrid.com/",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      method: "GET",
      params: {
        limit: 1,
        query: `(unique_args["courier-tracking-id"]="${EXTERNAL_ID}")`,
      },
      url: `v3/messages`,
    });
  });

  [
    "clicked",
    "delivered",
    "group_resubscribe",
    "group_unsubscribe",
    "open",
    "spamreport",
    "unsubscribe",
  ].forEach((testCase) => {
    it(`will return DELIVERED if the API returns ${testCase}`, async () => {
      axiosSpy.mockResolvedValue({
        data: { messages: [{ status: testCase }] },
      });

      const result = await getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("DELIVERED");
      expect(axiosSpy.mock.calls.length).toBe(1);
      expect((mockReplace as jest.Mock).mock.calls.length).toBe(0);

      expect(axiosSpy.mock.calls[0][0]).toMatchObject({
        baseURL: "https://api.sendgrid.com/",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        method: "GET",
        params: {
          limit: 1,
          query: `(unique_args["courier-tracking-id"]="${EXTERNAL_ID}")`,
        },
        url: `v3/messages`,
      });
    });
  });

  ["deferred", "processed"].forEach((testCase) => {
    it(`will return SENT if the API returns ${testCase}`, async () => {
      axiosSpy.mockResolvedValue({
        data: { messages: [{ status: testCase }] },
      });

      const result = await getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("SENT");
    });
  });

  ["blocked", "dropped", "newbadstatus"].forEach((testCase) => {
    it(`will return UNDELIVERABLE if the API returns ${testCase}`, async () => {
      axiosSpy.mockResolvedValue({
        data: { messages: [{ status: testCase }] },
      });

      const result = await getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("UNDELIVERABLE");
      expect(result.reason).toBe("FAILED");
    });
  });

  ["bounce", "not_delivered"].forEach((testCase) => {
    it(`will return UNDELIVERABLE if the API returns ${testCase}`, async () => {
      axiosSpy.mockResolvedValue({
        data: { messages: [{ status: testCase }] },
      });

      const result = await getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("UNDELIVERABLE");
      expect(result.reason).toBe("BOUNCED");
    });
  });

  it(`will return UNDELIVERABLE if the API returns something not covered`, async () => {
    axiosSpy.mockResolvedValue({
      data: { messages: [{}] },
    });

    const result = await getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("UNDELIVERABLE");
    expect(result.reason).toBe("FAILED");
  });

  [400, 401, 403].forEach((testCase) => {
    it(`will turn off check delivery and return SENT_NO_RETRY if the API rejects with a ${testCase} HTTP status`, async () => {
      axiosSpy.mockRejectedValue({
        response: { status: testCase },
      });

      const result = await getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect((mockReplace as jest.Mock).mock.calls.length).toBe(1);

      expect(result.status).toBe("SENT_NO_RETRY");
      expect(result.response.reason).toBeTruthy();
      expect((mockReplace as jest.Mock).mock.calls[0][0]).toStrictEqual({
        id: CONFIGURATION.id,
        tenantId: TENANT_ID,
        userId: undefined,
      });
      expect((mockReplace as jest.Mock).mock.calls[0][1]).toStrictEqual({
        id: CONFIGURATION.id,
        json: {
          apiKey: API_KEY,
          checkDeliveryStatus: false,
          deliveryTrackingDisabledByCourier: true,
        },
      });
    });
  });

  [429, 503].forEach((testCase) => {
    it(`will return SENT and ttl if the API rejects with a ${testCase} HTTP status`, async () => {
      Date.now = jest.fn(() => 1482363367071);

      axiosSpy.mockRejectedValue({
        response: { status: testCase },
      });

      const result = await getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("SENT");
      expect(result.response.ttl).toBe(1482363487);
    });
  });

  it("will throw if axios returns an uncovered HTTP status >= 402", async () => {
    axiosSpy.mockRejectedValue({
      response: { status: 402 },
    });

    await expect(
      getDeliveryStatus(EXTERNAL_ID, CONFIGURATION, TENANT_ID)
    ).rejects.toBeInstanceOf(ProviderResponseError);
  });

  it("will return SENT and ttl if axios returns a timeout code", async () => {
    Date.now = jest.fn(() => 1482363367071);

    axiosSpy.mockRejectedValue({
      code: "ECONNABORTED",
    });

    const result = await getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("SENT");
    expect(result.response.ttl).toBe(1482363487);
    expect(result.response.reason).toBe("API Timeout");
  });
});

describe("when getting status delivery is enabled", () => {
  it("will return falsy if value does not exist", () => {
    expect(getDeliveryStatusEnabled(getConfiguration())).toBeFalsy();
  });

  it("will return false if value is false", () => {
    expect(
      getDeliveryStatusEnabled(getConfiguration({ checkDeliveryStatus: false }))
    ).toBe(false);
  });

  it("will return true if value is true", () => {
    expect(
      getDeliveryStatusEnabled(getConfiguration({ checkDeliveryStatus: true }))
    ).toBe(true);
  });
});

describe("when getting external id", () => {
  it("will grab the correct value off providerResponse", () => {
    const providerResponse = {
      "courier-tracking-id": "we want this",
      "x-message-id": "we don't want this",
    };

    const result = getExternalId(providerResponse);

    expect(result).toBe("we want this");
  });
});

describe("when getting delivered timestamp", () => {
  it("will return the expected value in epoch format", () => {
    const providerDeliveredResponse = {
      data: { messages: [{ last_event_time: "2020-05-15T17:31:08Z" }] },
    };

    const result = getDeliveredTimestamp(providerDeliveredResponse);

    expect(result).toBe(1589563868000);
  });
});

describe("when getting reference", () => {
  it("will return courier-tracking-id and x-message-id from sent response", () => {
    const providerSentResponse = {
      "courier-tracking-id": "foo",
      "x-message-id": "for-webhook-correlation",
    };

    const result = getReference(providerSentResponse, undefined);

    expect(result).toStrictEqual({
      "courier-tracking-id": "foo",
      message_id: undefined,
      "x-message-id": "for-webhook-correlation",
    });
  });

  it("will return message_id from delivered response", () => {
    const providerDeliveredResponse = {
      data: { messages: [{ msg_id: "sendgrid-message-id" }] },
    };

    const result = getReference(undefined, providerDeliveredResponse);

    expect(result).toStrictEqual({
      "courier-tracking-id": undefined,
      message_id: "sendgrid-message-id",
      "x-message-id": undefined,
    });
  });
});
