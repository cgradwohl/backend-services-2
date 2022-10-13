import axios from "axios";
import {
  CheckDeliveryStatusError,
  ProviderResponseError,
} from "~/providers/errors";
import postmark from "~/providers/postmark";
import getConfiguration, { TENANT_ID } from "../__fixtures__/get-configuration";

const axiosSpy = axios as any as jest.Mock;

jest.mock("axios");

const EXTERNAL_ID = "an-external-id";
const API_KEY = "an-api-key";
const CONFIGURATION = {
  id: "a-configurtion-id",
  json: { apiKey: API_KEY },
} as any;

describe("when getting delivery status", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("will throw if it can't find an apiKey", async () => {
    await expect(
      postmark.getDeliveryStatus(
        EXTERNAL_ID,
        { json: { notApiKey: "something" } } as any,
        TENANT_ID
      )
    ).rejects.toBeInstanceOf(CheckDeliveryStatusError);

    expect(axiosSpy.mock.calls.length).toBe(0);
  });

  it("will return SENT if the API returns with 422 status and 701 ErrorCode", async () => {
    axiosSpy.mockResolvedValue({
      data: { ErrorCode: 701, Message: "Missing" },
      status: 422,
    });

    const result = await postmark.getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("SENT");

    expect(axiosSpy.mock.calls[0][0]).toMatchObject({
      baseURL: "https://api.postmarkapp.com/",
      headers: {
        "X-Postmark-Server-Token": API_KEY,
      },
      method: "GET",
      url: `messages/outbound/${EXTERNAL_ID}/details`,
    });
  });

  it("will throw ProviderResponseError if the API returns with 422 status and non-701 ErrorCode", async () => {
    axiosSpy.mockResolvedValue({
      data: { ErrorCode: 10, Message: "Bad API Token" },
      status: 422,
    });

    await expect(
      postmark.getDeliveryStatus(EXTERNAL_ID, CONFIGURATION, TENANT_ID)
    ).rejects.toBeInstanceOf(ProviderResponseError);
  });

  it("will return SENT if the API returns no messages", async () => {
    axiosSpy.mockResolvedValue({
      data: { MessageEvents: [] },
    });

    const result = await postmark.getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("SENT");

    expect(axiosSpy.mock.calls[0][0]).toMatchObject({
      baseURL: "https://api.postmarkapp.com/",
      headers: {
        "X-Postmark-Server-Token": API_KEY,
      },
      method: "GET",
      url: `messages/outbound/${EXTERNAL_ID}/details`,
    });
  });

  ["Delivered", "LinkClicked", "Opened"].forEach((testCase) => {
    it(`will return DELIVERED if the API returns ${testCase}`, async () => {
      axiosSpy.mockResolvedValue({
        data: { MessageID: "a-id", MessageEvents: [{ Type: testCase }] },
      });

      const result = await postmark.getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("DELIVERED");
      expect(result.reason).toBeUndefined();
      expect(axiosSpy.mock.calls.length).toBe(1);

      expect(axiosSpy.mock.calls[0][0]).toMatchObject({
        baseURL: "https://api.postmarkapp.com/",
        headers: {
          "X-Postmark-Server-Token": API_KEY,
        },
        method: "GET",
        url: `messages/outbound/${EXTERNAL_ID}/details`,
      });
    });
  });

  it(`will return SENT if the API returns Transient`, async () => {
    axiosSpy.mockResolvedValue({
      data: { MessageEvents: [{ Type: "Transient" }] },
    });

    const result = await postmark.getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("SENT");
    expect(result.reason).toBeUndefined();
  });

  it(`will return UNDELIVERABLE if the API returns Bounced`, async () => {
    axiosSpy.mockResolvedValue({
      data: {
        MessageEvents: [{ Type: "Bounced", Details: { Summary: "no dice" } }],
        MessageID: "a-id",
      },
    });

    const result = await postmark.getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("UNDELIVERABLE");
    expect(result.reason).toBeTruthy();
  });

  [429, 500, 503].forEach((testCase) => {
    it(`will return SENT and ttl if the API rejects with a ${testCase} HTTP status`, async () => {
      Date.now = jest.fn(() => 1482363367071);

      axiosSpy.mockRejectedValue({
        response: { status: testCase },
      });

      const result = await postmark.getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("SENT");
      expect(result.response.ttl).toBe(1482363487);
    });
  });

  it("will throw if axios returns an uncovered HTTP status >= 400", async () => {
    axiosSpy.mockRejectedValue({
      response: { status: 400 },
    });

    await expect(
      postmark.getDeliveryStatus(EXTERNAL_ID, CONFIGURATION, TENANT_ID)
    ).rejects.toBeInstanceOf(ProviderResponseError);
  });

  it("will return SENT and ttl if axios returns a timeout code", async () => {
    Date.now = jest.fn(() => 1482363367071);

    axiosSpy.mockRejectedValue({
      code: "ECONNABORTED",
    });

    const result = await postmark.getDeliveryStatus(
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
  it("will return true", () =>
    expect(postmark.getDeliveryStatusEnabled(getConfiguration())).toBe(true));
});

describe("when getting external id", () => {
  it("will grab the correct value off providerResponse", () => {
    const providerResponse = {
      MessageID: "we want this",
      "something-else": "we don't want this",
    };

    const result = postmark.getExternalId(providerResponse);

    expect(result).toBe("we want this");
  });
});

describe("when getting delivered timestamp", () => {
  it("will return the expected value in epoch format", () => {
    const providerDeliveredResponse = {
      data: {
        MessageEvents: [
          {
            ReceivedAt: "2020-05-26T11:50:01.0000000-04:00",
            Type: "Delivered",
          },
          {
            ReceivedAt: "2020-05-26T11:50:00.0000005-04:00",
            Type: "Transient",
          },
        ],
      },
    };

    const result = postmark.getDeliveredTimestamp(providerDeliveredResponse);

    expect(result).toBe(1590508201000);
  });

  it("will return undefined if string is not parseable", () => {
    const providerDeliveredResponse = "[Truncated] sadfasdafadsfs";

    const result = postmark.getDeliveredTimestamp(providerDeliveredResponse);

    expect(result).toBe(undefined);
  });

  // Not sure how this happened, but it can where I make it down to the MessageEvents
  // when the message is in a delivered state.
  it("will return undefined if array is missing Delivered entry", () => {
    const providerDeliveredResponse = {
      data: {
        MessageEvents: [
          {
            ReceivedAt: "2020-05-26T11:50:00.0000005-04:00",
            Type: "Transient",
          },
        ],
      },
    };

    const result = postmark.getDeliveredTimestamp(providerDeliveredResponse);

    expect(result).toBe(undefined);
  });
});

describe("when getting reference", () => {
  it("will return MessageID if there is sentData", () => {
    const providerSentResponse = {
      MessageID: "for-event-correlation",
    };

    const result = postmark.getReference(providerSentResponse, undefined);

    expect(result).toStrictEqual({
      MessageID: "for-event-correlation",
    });
  });

  it("will return undefined if sentData is undefined", () => {
    const result = postmark.getReference(undefined, undefined);

    expect(result).toStrictEqual({
      MessageID: undefined,
    });
  });
});
