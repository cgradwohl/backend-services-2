import axios from "axios";
// tslint:disable-next-line: no-var-requires
const Plivo = require("plivo");

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import {
  CheckDeliveryStatusError,
  ProviderResponseError,
} from "~/providers/errors";
import plivo from "~/providers/plivo";
import getDeliveredTimestamp from "~/providers/plivo/get-delivered-timestamp";
import getDeliveryStatus from "~/providers/plivo/get-delivery-status";
import getDeliveryStatusEnabled from "~/providers/plivo/get-delivery-status-enabled";
import getExternalId from "~/providers/plivo/get-external-id";
import getReference from "~/providers/plivo/get-reference";
import sendHandler from "~/providers/plivo/send";
import { DeliveryHandlerParams } from "~/providers/types";

import getConfiguration from "./__fixtures__/get-configuration";

jest.mock("plivo");

const axiosSpy = axios as any as jest.Mock;

jest.mock("axios");

const basicDeliveryParams = (
  config?: any,
  body: any = { profile: {} }
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
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

describe("plivo provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an auth id", async () => {
      const params = basicDeliveryParams();
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Auth ID specified."
      );
    });

    it("should require a auth token", async () => {
      const params = basicDeliveryParams({
        authId: "authidvalue",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Auth Token specified."
      );
    });

    it("should require a from number", async () => {
      const params = basicDeliveryParams({
        authId: "authidvalue",
        authToken: "authtokenvalue",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No From Number specified."
      );
    });

    it("should send a request to Plivo", async () => {
      Plivo.Client.mockImplementation(() => ({
        messages: {
          create: () => ({
            configuration: "55b9474f-7a33-442d-a8fe-42508fb923d6",
            delivered: 1575922923540,
            enqueued: 1575922917682,
            eventId: "e82abf11-e60c-4cdb-a1f6-0beeb03ca97d",
            provider: "plivo",
            providerResponse: {
              apiId: "8ff2fb0a-1ac1-11ea-bd06-0242ac110005",
              id: ["8ffd9b1e-1ac1-11ea-bd06-0242ac110005"],
              message: "message(s) queued",
              messageUuid: ["8ffd9b1e-1ac1-11ea-bd06-0242ac110005"],
            },
            recipientId: "082d3023-f0d8-4e82-ae4f-c7bbdfe6702a",
            status: "DELIVERED",
          }),
        },
      }));

      const params = basicDeliveryParams(
        {
          authId: "authidvalue",
          authToken: "authtokenvalue",
          fromNumber: "15555555",
        },
        {
          profile: {
            phone_number: "15554444",
          },
        }
      );
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).resolves.toEqual({
        configuration: "55b9474f-7a33-442d-a8fe-42508fb923d6",
        delivered: 1575922923540,
        enqueued: 1575922917682,
        eventId: "e82abf11-e60c-4cdb-a1f6-0beeb03ca97d",
        provider: "plivo",
        providerResponse: {
          apiId: "8ff2fb0a-1ac1-11ea-bd06-0242ac110005",
          id: ["8ffd9b1e-1ac1-11ea-bd06-0242ac110005"],
          message: "message(s) queued",
          messageUuid: ["8ffd9b1e-1ac1-11ea-bd06-0242ac110005"],
        },
        recipientId: "082d3023-f0d8-4e82-ae4f-c7bbdfe6702a",
        status: "DELIVERED",
      });
    });
  });

  describe("handles", () => {
    it("should return true when provided a phone number", () => {
      expect(
        plivo.handles({
          config: {} as any,
          profile: { phone_number: "15555555" },
        })
      ).toEqual(true);
    });

    it("should require email", () => {
      expect(
        plivo.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
  });
});

const externalId = "an-external-id";
const tenantId = "a-tenant-id";
const authId = "an-api-key";
const authToken = "moar-security";
const configuration = {
  id: "a-configurtion-id",
  json: { authId, authToken },
} as any;

describe("when getting delivery status", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("will throw if it can't find an accountSid", async () => {
    await expect(
      getDeliveryStatus(
        externalId,
        { json: { notAccountSid: "something" } } as any,
        tenantId
      )
    ).rejects.toBeInstanceOf(CheckDeliveryStatusError);

    expect(axiosSpy.mock.calls.length).toBe(0);
  });

  it("will throw if it can't find an authToken", async () => {
    await expect(
      getDeliveryStatus(
        externalId,
        { json: { accountSid: "something", notAuthToken: "wooo" } } as any,
        tenantId
      )
    ).rejects.toBeInstanceOf(CheckDeliveryStatusError);

    expect(axiosSpy.mock.calls.length).toBe(0);
  });

  it(`will return UNDELIVERABLE if the API returns inbound direction`, async () => {
    axiosSpy.mockResolvedValue({
      data: { direction: "inbound", status: "incoming" },
    });

    const result = await getDeliveryStatus(externalId, configuration, tenantId);

    expect(result.status).toBe("UNDELIVERABLE");
    expect(result.reason).toBeTruthy();
  });

  it(`will return DELIVERED if the API returns delivered`, async () => {
    axiosSpy.mockResolvedValue({
      data: { message_state: "delivered" },
    });

    const result = await getDeliveryStatus(externalId, configuration, tenantId);

    expect(result.status).toBe("DELIVERED");
    expect(axiosSpy.mock.calls.length).toBe(1);

    expect(axiosSpy.mock.calls[0][0]).toMatchObject({
      auth: {
        password: authToken,
        username: authId,
      },
      baseURL: "https://api.plivo.com/v1/",
      method: "GET",
      url: `/Account/${authId}/Message/${externalId}`,
    });
  });

  ["queued", "received", "sent"].forEach((testCase) => {
    it(`will return SENT if the API returns ${testCase}`, async () => {
      axiosSpy.mockResolvedValue({
        data: { message_state: testCase },
      });

      const result = await getDeliveryStatus(
        externalId,
        configuration,
        tenantId
      );

      expect(result.status).toBe("SENT");
    });
  });

  ["failed", "rejected", "undelivered", "newbadstatus"].forEach((testCase) => {
    it(`will return UNDELIVERABLE if the API returns ${testCase}`, async () => {
      axiosSpy.mockResolvedValue({
        data: {
          direction: "outbound-api",
          errorCode: 20429,
          errorMessage: "Bad",
          status: testCase,
        },
      });

      const result = await getDeliveryStatus(
        externalId,
        configuration,
        tenantId
      );

      expect(result.status).toBe("UNDELIVERABLE");
      expect(result.reason).toBeTruthy();
    });
  });

  [500].forEach((testCase) => {
    it(`will return SENT and ttl if the API rejects with a ${testCase} HTTP status`, async () => {
      Date.now = jest.fn(() => 1482363367071);

      axiosSpy.mockRejectedValue({
        response: { status: testCase },
      });

      const result = await getDeliveryStatus(
        externalId,
        configuration,
        tenantId
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
      getDeliveryStatus(externalId, configuration, tenantId)
    ).rejects.toBeInstanceOf(ProviderResponseError);
  });

  it("will return SENT and ttl if axios returns a timeout code", async () => {
    Date.now = jest.fn(() => 1482363367071);

    axiosSpy.mockRejectedValue({
      code: "ECONNABORTED",
    });

    const result = await getDeliveryStatus(externalId, configuration, tenantId);

    expect(result.status).toBe("SENT");
    expect(result.response.ttl).toBe(1482363487);
    expect(result.response.reason).toBe("API Timeout");
  });
});

describe("when getting status delivery is enabled", () => {
  it("will return true", () => {
    expect(getDeliveryStatusEnabled(getConfiguration())).toBe(true);
  });
});

describe("when getting external id", () => {
  it("will grab the correct value off providerResponse", () => {
    const providerResponse = {
      messageUuid: ["we want this"],
      "something-else": "we don't want this",
    };

    const result = getExternalId(providerResponse);

    expect(result).toBe("we want this");
  });
});

describe("when getting delivered timestamp", () => {
  it("will return the expected value in epoch format", () => {
    const providerDeliveredResponse = {
      data: {
        message_state: "delivered",
        message_time: "2020-11-18 14:35:39.623743-07:00",
      },
    };

    const result = getDeliveredTimestamp(providerDeliveredResponse);

    expect(result).toBe(1605735339623);
  });
});

describe("when getting reference", () => {
  it("will return message UUID if there is sentResponse as IResponse", () => {
    const providerSentResponse = {
      messageUuid: ["for-tracking-plivo"],
    };

    const result = getReference(providerSentResponse, undefined);

    expect(result).toStrictEqual({
      messageUuid: "for-tracking-plivo",
    });
  });

  it("will return message UUID if there is sentResponse as IMessage", () => {
    const providerSentResponse = {
      data: {
        message_uuid: "for-tracking-plivo",
      },
    };

    const result = getReference(providerSentResponse, undefined);

    expect(result).toStrictEqual({
      messageUuid: "for-tracking-plivo",
    });
  });

  it("will return undefined if sendData is undefined", () => {
    const providerSentResponse = undefined;

    const result = getReference(providerSentResponse, undefined);

    expect(result).toStrictEqual({
      messageUuid: undefined,
    });
  });
});
