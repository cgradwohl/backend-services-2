import axios from "axios";

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import sendHandler from "~/providers/sparkpost/send";
import { DeliveryHandlerParams } from "~/providers/types";

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
    emailTemplateConfig: {},
    linkHandler,
    profile: body.profile,
    sentProfile: body.profile,
    variableData,
    variableHandler,
  };
};

describe("sparkpost provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

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

    it("should send a request to SparkPost", async () => {
      (axios as any as jest.Mock).mockResolvedValue({
        data: {
          results: {
            total_rejected_recipients: 0,
            total_accepted_recipients: 1,
            id: "7031140434564679294",
          },
        },
        headers: {
          date: "Sun, 21 Nov 2021 21:54:25 GMT",
          "content-type": "application/json; charset=utf-8",
          "content-length": "100",
          connection: "close",
          "uber-trace-id": "529b1db98597a2fb:529b1db98597a2fb:0:0",
          vary: "X-HTTP-Method-Override",
          "x-msys-entity-id": "7031140434564679294",
          etag: 'W/"64-YvSm26j9ghG4XP8uomF6qKqBrsg"',
          server: "msys-http",
          "cache-control": "no-cache, no-store",
        },
        status: 200,
        statusText: "OK",
      });

      const params = basicDeliveryParams(
        {
          apiKey: "apikeyvalue",
          fromAddress: "test@courier.com",
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
        data: {
          results: {
            total_rejected_recipients: 0,
            total_accepted_recipients: 1,
            id: "7031140434564679294",
          },
        },
        headers: {
          date: "Sun, 21 Nov 2021 21:54:25 GMT",
          "content-type": "application/json; charset=utf-8",
          "content-length": "100",
          connection: "close",
          "uber-trace-id": "529b1db98597a2fb:529b1db98597a2fb:0:0",
          vary: "X-HTTP-Method-Override",
          "x-msys-entity-id": "7031140434564679294",
          etag: 'W/"64-YvSm26j9ghG4XP8uomF6qKqBrsg"',
          server: "msys-http",
          "cache-control": "no-cache, no-store",
        },
        status: 200,
        statusText: "OK",
      });
      expect(axios).toHaveBeenCalledTimes(1);
      expect(axios).toHaveBeenCalledWith({
        data: {
          content: {
            from: {
              email: "test@courier.com",
              name: undefined,
            },
            html: "",
            replyTo: undefined,
            subject: "",
            text: "",
          },
          headers: undefined,
          options: {
            transactional: true,
          },
          recipients: [
            {
              address: {
                email: "recipient@courier.com",
                name: undefined,
              },
            },
          ],
        },
        headers: {
          Authorization: "apikeyvalue",
          "Content-Type": "application/json",
        },
        method: "post",
        timeout: 10000,
        timeoutErrorMessage: "Sparkpost API request timed out.",
        url: "https://api.sparkpost.com/api/v1/transmissions",
      });
    });
  });
});
