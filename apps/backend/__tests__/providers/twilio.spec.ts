import axios from "axios";

import {
  CheckDeliveryStatusError,
  ProviderResponseError,
  RetryableProviderResponseError,
} from "~/providers/errors";
import getDeliveredTimestamp from "~/providers/twilio/get-delivered-timestamp";
import getDeliveryStatus from "~/providers/twilio/get-delivery-status";
import getDeliveryStatusEnabled from "~/providers/twilio/get-delivery-status-enabled";
import getExternalId from "~/providers/twilio/get-external-id";
import getReference from "~/providers/twilio/get-reference";
import send from "~/providers/twilio/send";
import handleError from "~/providers/twilio/error-handler";
import * as encodeUrlData from "~/providers/send-helpers";

import getConfiguration from "./__fixtures__/get-configuration";

jest.mock("axios");

const axiosSpy = axios as any as jest.Mock;

const axiosPostSpy = jest.spyOn(axios, "post");

const encodeUrlDataSpy = jest.spyOn(encodeUrlData, "encodeUrlData");

const EXTERNAL_ID = "an-external-id";
const TENANT_ID = "a-tenant-id";
const ACCOUNT_SID = "an-api-key";
const AUTH_TOKEN = "moar-security";
const CONFIGURATION = {
  id: "a-configurtion-id",
  json: { accountSid: ACCOUNT_SID, authToken: AUTH_TOKEN },
} as any;

const templates = {
  plain:
    "Hello X,\n" +
    "Revenge of the Sith was clearly the best of the prequel trilogy." +
    "Best regards,\n" +
    "\n" +
    "Courier",
};

const expectedTwilioResponse = {
  data: {
    sid: "redacted",
    date_created: "Mon, 20 Jun 2022 22:00:04 +0000",
    date_updated: "Mon, 20 Jun 2022 22:00:04 +0000",
    date_sent: null,
    account_sid: ACCOUNT_SID,
    to: "+99999999999",
    from: null,
    messaging_service_sid: "MG9752274e9e519418a7406176694466fa",
    body: "redacted",
    status: "accepted",
    num_segments: "1",
    num_media: "1",
    direction: "outbound-api",
    api_version: "2010-04-01",
    price: null,
    price_unit: null,
    error_code: null,
    error_message: null,
    uri: "/2010-04-01/Accounts/redacted/Messages/redacted.json",
    subresource_uris: {
      media: "/2010-04-01/Accounts/redacted/Messages/redacted/Media.json",
    },
  },
};

type TwilioError = Error & {
  response: {
    status: number;
    data: { code: number; status: number; message: string };
  };
};

const createError = (status: number, code?: number) => {
  const err = new Error() as TwilioError;
  err.response = {
    status: null,
    data: { code: null, status: null, message: null },
  };
  err.response.status = status;
  err.response.data.code = code;

  return err;
};

describe("when handling send errors", () => {
  const retryableCodes = [
    20003, 20005, 20006, 20008, 20010, 20403, 20426, 20429,
  ];
  for (const code of retryableCodes) {
    it(`will throw RetryableProviderResponseError if err status is 400 and code is ${code}`, () =>
      expect(() => handleError(createError(400, code))).toThrow(
        RetryableProviderResponseError
      ));
  }

  it("will throw ProviderResponseError if err status is 400 and code is not a match", () =>
    expect(() => handleError(createError(400, 42))).toThrow(
      ProviderResponseError
    ));

  it("will throw RetryableProviderResponseError if err status is 429", () =>
    expect(() => handleError(createError(429))).toThrow(
      RetryableProviderResponseError
    ));

  it("will throw RetryableProviderResponseError if err status is 500", () =>
    expect(() => handleError(createError(500))).toThrow(
      RetryableProviderResponseError
    ));

  it("will throw RetryableProviderResponseError if err status is 503", () =>
    expect(() => handleError(createError(503))).toThrow(
      RetryableProviderResponseError
    ));

  it("will throw ProviderResponseError if err status is 401", () =>
    expect(() => handleError(createError(401))).toThrow(ProviderResponseError));

  it("will throw ProviderResponseError if err status is 404", () =>
    expect(() => handleError(createError(404))).toThrow(ProviderResponseError));

  it("will throw ProviderResponseError if err status is 405", () =>
    expect(() => handleError(createError(405))).toThrow(ProviderResponseError));

  it("will throw ProviderResponseError if err does not contain a status code", () =>
    expect(() => handleError(new Error())).toThrow(ProviderResponseError));
});

describe("when getting delivery status", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("will throw if it can't find an accountSid", async () => {
    await expect(
      getDeliveryStatus(
        EXTERNAL_ID,
        { json: { notAccountSid: "something" } } as any,
        TENANT_ID
      )
    ).rejects.toBeInstanceOf(CheckDeliveryStatusError);

    expect(axiosSpy.mock.calls.length).toBe(0);
  });

  it("will throw if it can't find an authToken", async () => {
    await expect(
      getDeliveryStatus(
        EXTERNAL_ID,
        { json: { accountSid: "something", notAuthToken: "wooo" } } as any,
        TENANT_ID
      )
    ).rejects.toBeInstanceOf(CheckDeliveryStatusError);

    expect(axiosSpy.mock.calls.length).toBe(0);
  });

  it(`will return UNDELIVERABLE if the API returns inbound direction`, async () => {
    axiosSpy.mockResolvedValue({
      data: { direction: "inbound", status: "incoming" },
    });

    const result = await getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("UNDELIVERABLE");
    expect(result.reason).toBeTruthy();
  });

  it(`will return DELIVERED if the API returns delivered`, async () => {
    axiosSpy.mockResolvedValue({
      data: { direction: "outbound-api", status: "delivered" },
    });

    const result = await getDeliveryStatus(
      EXTERNAL_ID,
      CONFIGURATION,
      TENANT_ID
    );

    expect(result.status).toBe("DELIVERED");
    expect(axiosSpy.mock.calls.length).toBe(1);

    expect(axiosSpy.mock.calls[0][0]).toMatchObject({
      auth: {
        password: AUTH_TOKEN,
        username: ACCOUNT_SID,
      },
      baseURL: "https://api.twilio.com/2010-04-01/",
      method: "GET",
      url: `/Accounts/${ACCOUNT_SID}/Messages/${EXTERNAL_ID}.json`,
    });
  });

  ["accepted", "queued", "sending", "sent"].forEach((testCase) => {
    it(`will return SENT if the API returns ${testCase}`, async () => {
      axiosSpy.mockResolvedValue({
        data: { direction: "outbound-api", status: testCase },
      });

      const result = await getDeliveryStatus(
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("SENT");
    });
  });

  ["failed", "undelivered", "newbadstatus"].forEach((testCase) => {
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
        EXTERNAL_ID,
        CONFIGURATION,
        TENANT_ID
      );

      expect(result.status).toBe("UNDELIVERABLE");
      expect(result.reason).toBeTruthy();
    });
  });

  [429, 500, 503].forEach((testCase) => {
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
  it("will return true", () => {
    expect(getDeliveryStatusEnabled(getConfiguration())).toBe(true);
  });
});

describe("when getting external id", () => {
  it("will grab the correct value off providerResponse", () => {
    const providerResponse = {
      sid: "we want this",
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
        date_updated: "Fri, 24 May 2019 17:18:28 +0000",
        status: "delivered",
      },
    };

    const result = getDeliveredTimestamp(providerDeliveredResponse);

    expect(result).toBe(1558718308000);
  });
});

describe("when getting reference", () => {
  it("will return sid if there is sentResponse", () => {
    const providerSentResponse = {
      sid: "for-tracking-twilio",
    };

    const result = getReference(providerSentResponse, undefined);

    expect(result).toStrictEqual({
      sid: "for-tracking-twilio",
    });
  });

  it("will return undefined if sendData is undefined", () => {
    const providerSentResponse = undefined;

    const result = getReference(providerSentResponse, undefined);

    expect(result).toStrictEqual({
      sid: undefined,
    });
  });
});

describe("when making a send call to Twilio", () => {
  beforeEach(() => {
    axiosPostSpy.mockResolvedValue(expectedTwilioResponse);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("will call encodeUrlData with UpperCamelCase attributes", async () => {
    const params = {
      config: {
        provider: "twilio",
        accountSid: ACCOUNT_SID,
        authToken: AUTH_TOKEN,
        messagingServiceSid: "MG9752274e9e519418a7406176694466fa",
      },
      override: {
        body: {
          mediaUrl:
            "https://upload.wikimedia.org/wikipedia/commons/2/26/Smile.png",
          To: "+99999999999",
        },
        config: {
          accountSid: "overrode-an-api-key",
          messagingServiceSid: "overridden messaging service sid",
        },
      },
      profile: { phone_number: "+44918239847" },
      variableData: { profile: { phone_number: "+44918239847" } },
    };

    await send(params, templates);

    expect(encodeUrlDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        To: "+99999999999",
        MessagingServiceSid: "overridden messaging service sid",
        Body:
          "Hello X,\n" +
          "Revenge of the Sith was clearly the best of the prequel trilogy." +
          "Best regards,\n" +
          "\n" +
          "Courier",
        MediaUrl:
          "https://upload.wikimedia.org/wikipedia/commons/2/26/Smile.png",
      })
    );
  });

  it("will create a valid URI Component from encodeUrlData", async () => {
    const params = {
      Body:
        "Hello X,\n" +
        "Revenge of the Sith was clearly the best of the prequel trilogy." +
        "Best regards,\n" +
        "\n" +
        "Courier",
      MessagingServiceSid: "MG9752274e9e519418a7406176694466fa",
      To: "+44918239847",
    };

    encodeUrlDataSpy.mockRestore();

    const response = encodeUrlData.encodeUrlData(params);

    const expected =
      "Body=Hello%20X%2C%0ARevenge%20of%20the%20Sith%20was%20clearly%20the%20best%20of%20the%20prequel%20trilogy.Best%20regards%2C%0A%0ACourier&MessagingServiceSid=MG9752274e9e519418a7406176694466fa&To=%2B44918239847";

    expect(response).toBe(expected);
  });

  it("will correctly override config.AuthToken attribute", async () => {
    const params = {
      config: {
        provider: "twilio",
        accountSid: ACCOUNT_SID,
        authToken: AUTH_TOKEN,
        messagingServiceSid: "MG9752274e9e519418a7406176694466fa",
      },
      override: {
        config: {
          AuthToken: "overrode-moar-security",
        },
      },
      profile: { phone_number: "+44918239847" },
      variableData: { profile: { phone_number: "+44918239847" } },
    };

    await send(params, templates);

    expect(axios.post).toHaveBeenCalledWith(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      "Body=Hello%20X%2C%0ARevenge%20of%20the%20Sith%20was%20clearly%20the%20best%20of%20the%20prequel%20trilogy.Best%20regards%2C%0A%0ACourier&MessagingServiceSid=MG9752274e9e519418a7406176694466fa&To=%2B44918239847",
      expect.objectContaining({
        auth: expect.objectContaining({
          password: "overrode-moar-security",
        }),
      })
    );
  });

  it("will respond with correct object shape and keys", async () => {
    const params = {
      config: {
        provider: "twilio",
        accountSid: ACCOUNT_SID,
        authToken: AUTH_TOKEN,
        messagingServiceSid: "MG9752274e9e519418a7406176694466fa",
      },
      override: {
        body: {
          mediaUrl:
            "https://upload.wikimedia.org/wikipedia/commons/2/26/Smile.png",
          To: "+99999999999",
        },
        config: {
          accountSid: "overrode-an-api-key",
          messagingServiceSid: "overridden messaging service sid",
        },
      },
      profile: { phone_number: "+44918239847" },
      variableData: { profile: { phone_number: "+44918239847" } },
    };

    const response = await send(params, templates);

    expect(response).toMatchObject(expectedTwilioResponse.data);
  });
});
