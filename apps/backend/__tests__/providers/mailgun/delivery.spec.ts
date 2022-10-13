import axios from "axios";
import getConfiguration, {
  TENANT_ID,
} from "~/__tests__/providers/__fixtures__/get-configuration";
import {
  CheckDeliveryStatusError,
  ProviderResponseError,
} from "~/providers/errors";
import mailgun from "~/providers/mailgun";

const axiosSpy = axios as any as jest.Mock;

jest.mock("axios");

const EXTERNAL_ID = "an-external-id";
const API_KEY = "an-api-key";
const DOMAIN = "a-domain";
const CONFIGURATION = {
  id: "a-configurtion-id",
  json: { apiKey: API_KEY, domain: DOMAIN },
} as any;

describe("when getting delivery status", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("will throw if it can't find an apiKey", async () => {
    await expect(
      mailgun.getDeliveryStatus(
        EXTERNAL_ID,
        { json: { notApiKey: "something" } } as any,
        TENANT_ID
      )
    ).rejects.toBeInstanceOf(CheckDeliveryStatusError);

    expect(axiosSpy.mock.calls.length).toBe(0);
  });

  it("will throw if it can't find a domain", async () => {
    await expect(
      mailgun.getDeliveryStatus(
        EXTERNAL_ID,
        { json: { apiKey: API_KEY, notApiKey: "something" } } as any,
        TENANT_ID
      )
    ).rejects.toBeInstanceOf(CheckDeliveryStatusError);

    expect(axiosSpy.mock.calls.length).toBe(0);
  });

  it("will return SENT if the API returns no messages", async () => {
    axiosSpy.mockResolvedValue({
      data: { items: [] },
    });

    const result = await mailgun.getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("SENT");

    expect(axiosSpy.mock.calls[0][0]).toMatchObject({
      auth: {
        password: "an-api-key",
        username: "api",
      },
      baseURL: "https://api.mailgun.net",
      method: "GET",
      params: {
        "message-id": EXTERNAL_ID,
      },
      url: `v3/${DOMAIN}/events`,
    });
  });

  ["complained", "delivered", "opened", "clicked", "unsubscribed"].forEach(
    (testCase) => {
      it(`will return DELIVERED if the API returns ${testCase}`, async () => {
        axiosSpy.mockResolvedValue({
          data: { items: [{ event: testCase }] },
        });

        const result = await mailgun.getDeliveryStatus(
          EXTERNAL_ID,
          CONFIGURATION,
          TENANT_ID
        );

        expect(result.status).toBe("DELIVERED");
        expect(result.reason).toBeUndefined();
        expect(axiosSpy.mock.calls.length).toBe(1);

        expect(axiosSpy.mock.calls[0][0]).toMatchObject({
          auth: {
            password: "an-api-key",
            username: "api",
          },
          baseURL: "https://api.mailgun.net",
          method: "GET",
          params: {
            "message-id": EXTERNAL_ID,
          },
          url: `v3/${DOMAIN}/events`,
        });
      });
    }
  );

  ["accepted", "stored"].forEach((testCase) => {
    it(`will return SENT if the API returns ${testCase}`, async () => {
      axiosSpy.mockResolvedValue({
        data: { items: [{ event: testCase }] },
      });

      const result = await mailgun.getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("SENT");
      expect(result.reason).toBeUndefined();
    });
  });

  it(`will return UNDELIVERABLE if the API returns rejected`, async () => {
    axiosSpy.mockResolvedValue({
      data: { items: [{ event: "rejected", reject: { reason: "rejected" } }] },
    });

    const result = await mailgun.getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("UNDELIVERABLE");
    expect(result.reason).toBeTruthy();
  });

  it(`will return UNDELIVERABLE if the API returns failed and severity permanant`, async () => {
    axiosSpy.mockResolvedValue({
      data: {
        items: [
          {
            "delivery-status": { message: "", description: "" },
            event: "failed",
            reason: "good reason",
            severity: "permanant",
          },
        ],
      },
    });

    const result = await mailgun.getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("UNDELIVERABLE");
    expect(result.reason).toBeTruthy();
  });

  it(`will return SENT if the API returns failed and severity temporary`, async () => {
    axiosSpy.mockResolvedValue({
      data: {
        items: [
          { event: "failed", severity: "temporary", reason: "aright reason" },
        ],
      },
    });

    const result = await mailgun.getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("SENT");
    expect(result.reason).toBeUndefined();
  });

  [500, 502, 503, 504].forEach((testCase) => {
    it(`will return SENT and ttl if the API rejects with a ${testCase} HTTP status`, async () => {
      Date.now = jest.fn(() => 1482363367071);

      axiosSpy.mockRejectedValue({
        response: { status: testCase },
      });

      const result = await mailgun.getDeliveryStatus(
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
      mailgun.getDeliveryStatus(EXTERNAL_ID, CONFIGURATION, TENANT_ID)
    ).rejects.toBeInstanceOf(ProviderResponseError);
  });

  it("will return SENT and ttl if axios returns a timeout code", async () => {
    Date.now = jest.fn(() => 1482363367071);

    axiosSpy.mockRejectedValue({
      code: "ECONNABORTED",
    });

    const result = await mailgun.getDeliveryStatus(
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
    expect(mailgun.getDeliveryStatusEnabled(getConfiguration())).toBe(true));
});

describe("when getting external id", () => {
  it("will grab the correct value off providerResponse", () => {
    const providerResponse = {
      id: "we want this",
      "something-else": "we don't want this",
    };

    const result = mailgun.getExternalId(providerResponse);

    expect(result).toBe("we want this");
  });

  it("will return empty string if id is missing", () => {
    const providerResponse = {
      "something-else": "we don't want this",
    };

    const result = mailgun.getExternalId(providerResponse);

    expect(result).toBe("");
  });
});

describe("when getting delivered timestamp", () => {
  it("will return the expected value in epoch format if data is the array", () => {
    const providerDeliveredResponse = {
      data: [
        { event: "delivered", timestamp: 1590213763.150152 },
        { event: "accepted", timestamp: 1590213762.614617 },
      ],
    };

    const result = mailgun.getDeliveredTimestamp(providerDeliveredResponse);

    expect(result).toBe(1590213763150);
  });

  it("will return the expected value in epoch format if data has the items array", () => {
    const providerDeliveredResponse = {
      data: {
        items: [
          { event: "delivered", timestamp: 1590213763.150152 },
          { event: "accepted", timestamp: 1590213762.614617 },
        ],
      },
    };

    const result = mailgun.getDeliveredTimestamp(providerDeliveredResponse);

    expect(result).toBe(1590213763150);
  });
});

describe("when getting reference", () => {
  it("will return id if there is sentData", () => {
    const providerSentResponse = {
      id: "for-event-correlation",
    };

    const result = mailgun.getReference(providerSentResponse, undefined);

    expect(result).toStrictEqual({
      id: "for-event-correlation",
    });
  });

  it("will return undefined if sentData is undefined", () => {
    const result = mailgun.getReference(undefined, undefined);

    expect(result).toStrictEqual({
      id: undefined,
    });
  });
});
