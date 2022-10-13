import axios from "axios";

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import {
  CheckDeliveryStatusError,
  ProviderResponseError,
} from "~/providers/errors";
import mandrill from "~/providers/mandrill";
import sendHandler from "~/providers/mandrill/send";
import {
  IMandrillInfoResponse,
  MandrillSendResponse,
} from "~/providers/mandrill/types";
import { DeliveryHandlerParams } from "~/providers/types";
import getConfiguration, { TENANT_ID } from "./__fixtures__/get-configuration";

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
      provider: "",
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

describe("mandrill provider", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("send", () => {
    it("should require an api key", async () => {
      const params = basicDeliveryParams();
      const templates = {
        bcc: "",
        cc: "",
        from: "",
        html: "",
        replyTo: "",
        subject: "",
        text: "",
      };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Key specified."
      );
    });

    it("should require a from address", async () => {
      const params = basicDeliveryParams({ apiKey: "apikeyvalue" });
      const templates = {
        bcc: "",
        cc: "",
        from: "",
        html: "",
        replyTo: "",
        subject: "",
        text: "",
      };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No from address specified."
      );
    });

    it("should require a from name", async () => {
      const params = basicDeliveryParams({
        apiKey: "apikeyvalue",
        fromAddress: "test@courier.com",
      });
      const templates = {
        bcc: "",
        cc: "",
        from: "",
        html: "",
        replyTo: "",
        subject: "",
        text: "",
      };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No from name specified."
      );
    });

    it("should send an email request to Mandrill", async () => {
      axiosSpy.mockResolvedValue({
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      });

      const params = basicDeliveryParams(
        {
          apiKey: "apikeyvalue",
          fromAddress: "test@courier.com",
          fromName: "Tester",
        },
        {
          profile: {
            email: "recipient@courier.com",
          },
        }
      );

      const templates = {
        bcc: "",
        cc: "",
        from: "",
        html: "",
        replyTo: "",
        subject: "",
        text: "",
      };
      await expect(sendHandler(params, templates)).resolves.toEqual({
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      });

      expect(axiosSpy.mock.calls.length).toBe(1);
      const {
        data: { key, message },
      } = axiosSpy.mock.calls[0][0];

      expect(key).toBe("apikeyvalue");
      expect(message.from_email).toBe("test@courier.com");
      expect(message.from_name).toBe("Tester");
      expect(message.to).toEqual([
        {
          email: "recipient@courier.com",
          name: undefined,
          type: "to",
        },
      ]);
    });
  });

  const externalId = "an-external-id";
  const apiKey = "an-api-key";
  const configuration = {
    id: "a-configurtion-id",
    json: { apiKey },
  } as any;

  describe("when getting delivery status", () => {
    it("will throw if it can't find an apiKey", async () => {
      await expect(
        mandrill.getDeliveryStatus(
          externalId,
          { json: { notApiKey: "something" } } as any,
          TENANT_ID
        )
      ).rejects.toBeInstanceOf(CheckDeliveryStatusError);

      expect(axiosSpy.mock.calls.length).toBe(0);
    });

    it("will return SENT if the API returns with empty SMTP events", async () => {
      axiosSpy.mockResolvedValue({
        data: { smtp_events: [] },
        status: 200,
      });

      const result = await mandrill.getDeliveryStatus(
        externalId,
        configuration,
        TENANT_ID
      );

      expect(result.status).toBe("SENT");

      expect(axiosSpy.mock.calls[0][0]).toMatchObject({
        baseURL: "https://mandrillapp.com/api/1.0/",
        data: {
          id: externalId,
          key: apiKey,
        },
        method: "POST",
        url: "messages/info.json",
      });
    });

    it(`will return DELIVERED if the API contains a 2xx value`, async () => {
      const smtpEvents = [{ diag: "420 retrying" }, { diag: "250 OK" }];
      axiosSpy.mockResolvedValue({
        data: { smtp_events: smtpEvents },
      });

      const result = await mandrill.getDeliveryStatus(
        externalId,
        configuration,
        TENANT_ID
      );

      expect(result.status).toBe("DELIVERED");
      expect(result.reason).toBeUndefined();
      expect(axiosSpy.mock.calls.length).toBe(1);

      expect(axiosSpy.mock.calls[0][0]).toMatchObject({
        baseURL: "https://mandrillapp.com/api/1.0/",
        data: {
          id: externalId,
          key: apiKey,
        },
        method: "POST",
        url: "messages/info.json",
      });
    });

    it(`will return SENT if the API returns a 4xx value`, async () => {
      const smtpEvents = [{ diag: "420 retrying" }];
      axiosSpy.mockResolvedValue({
        data: { smtp_events: smtpEvents },
      });

      const result = await mandrill.getDeliveryStatus(
        externalId,
        configuration,
        TENANT_ID
      );

      expect(result.status).toBe("SENT");
      expect(result.reason).toBeUndefined();
    });

    it(`will return UNDELIVERABLE if the API contains a 5xx value and no 2xx value`, async () => {
      const smtpEvents = [{ diag: "420 retrying" }, { diag: "500 doh" }];
      axiosSpy.mockResolvedValue({
        data: { smtp_events: smtpEvents },
      });

      const result = await mandrill.getDeliveryStatus(
        externalId,
        configuration,
        TENANT_ID
      );

      expect(result.status).toBe("UNDELIVERABLE");
      expect(result.reason).toBeTruthy();
    });

    ["GeneralError", "Unknown_Message"].forEach((testCase) => {
      it(`will return SENT if the API returns with 500 status and ${testCase}`, async () => {
        axiosSpy.mockRejectedValue({
          response: {
            data: { name: testCase },
            status: 500,
          },
        });

        const result = await mandrill.getDeliveryStatus(
          externalId,
          configuration,
          TENANT_ID
        );

        expect(result.status).toBe("SENT");
      });
    });

    it("will throw ProviderResponseError if the API returns with 500 status and non GeneralError", async () => {
      axiosSpy.mockRejectedValue({
        response: {
          data: { name: "InvalidKey" },
          status: 500,
        },
      });

      await expect(
        mandrill.getDeliveryStatus(externalId, configuration, TENANT_ID)
      ).rejects.toBeInstanceOf(ProviderResponseError);
    });

    it("will throw if axios returns an uncovered HTTP status >= 400", async () => {
      axiosSpy.mockRejectedValue({
        response: { status: 400 },
      });

      await expect(
        mandrill.getDeliveryStatus(externalId, configuration, TENANT_ID)
      ).rejects.toBeInstanceOf(ProviderResponseError);
    });

    it("will return SENT and ttl if axios returns a timeout code", async () => {
      Date.now = jest.fn(() => 1482363367071);

      axiosSpy.mockRejectedValue({
        code: "ECONNABORTED",
      });

      const result = await mandrill.getDeliveryStatus(
        externalId,
        configuration,
        TENANT_ID
      );

      expect(result.status).toBe("SENT");
      expect(result.response.ttl).toBe(1482363487);
      expect(result.response.reason).toBe("API Timeout");
    });
  });

  describe("when getting status delivery is enabled", () => {
    it("will return true", () =>
      expect(mandrill.getDeliveryStatusEnabled(getConfiguration())).toBe(true));
  });

  describe("when getting external id", () => {
    it("will grab the correct value off providerResponse", () => {
      const providerResponse: { data: MandrillSendResponse } = {
        data: [
          {
            _id: "we want this",
          },
        ],
      };

      const result = mandrill.getExternalId(providerResponse);

      expect(result).toBe("we want this");
    });
  });

  describe("when getting delivered timestamp", () => {
    it("will return the expected value in epoch format", () => {
      const providerDeliveredResponse: { data: IMandrillInfoResponse } = {
        data: {
          _id: externalId,
          smtp_events: [
            {
              diag: "250 OK",
              ts: 1590508201,
              type: "sent",
            },
          ],
        },
      };

      const result = mandrill.getDeliveredTimestamp(providerDeliveredResponse);

      expect(result).toBe(1590508201000);
    });
  });

  describe("when getting reference", () => {
    it("will return _id if there is sentData", () => {
      const providerSentResponse: { data: MandrillSendResponse } = {
        data: [
          {
            _id: "for-event-correlation",
          },
        ],
      };

      const result = mandrill.getReference(providerSentResponse, undefined);

      expect(result).toStrictEqual({
        _id: "for-event-correlation",
      });
    });

    it("will return undefined if sentData is empty", () => {
      const providerSentResponse: { data: MandrillSendResponse } = {
        data: [],
      };

      const result = mandrill.getReference(providerSentResponse, undefined);

      expect(result).toStrictEqual({
        _id: undefined,
      });
    });

    it("will return undefined if sentData is undefined", () => {
      const result = mandrill.getReference(undefined, undefined);

      expect(result).toStrictEqual({
        _id: undefined,
      });
    });
  });
});
