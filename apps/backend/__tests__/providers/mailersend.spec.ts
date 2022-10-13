import axios from "axios";

import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import sendHandler from "~/providers/mailersend/send";
import { DeliveryHandlerParams } from "~/providers/types";

const axiosSpy = axios as any as jest.Mock;

jest.mock("axios");

const API_KEY_VALUE = "API_KEY_VALUE";
const FROM_EMAIL_ADDRESS = "test@courier.com";
const TO_EMAIL_ADDRESS = "recipient@courier.com";
const TEMPLATES = {
  bcc: "",
  cc: "",
  from: "",
  html: "",
  replyTo: "",
  subject: "",
  text: "",
};

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

describe("MailerSend provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an api key", async () => {
      const params = basicDeliveryParams();

      await expect(sendHandler(params, TEMPLATES)).rejects.toHaveProperty(
        "message",
        "No 'API Key' specified."
      );
    });

    it("should require a from address", async () => {
      const params = basicDeliveryParams({ apiKey: API_KEY_VALUE });

      await expect(sendHandler(params, TEMPLATES)).rejects.toHaveProperty(
        "message",
        "No 'From Address' specified."
      );
    });

    it("should send an email request to MailerSend", async () => {
      axiosSpy.mockResolvedValue({
        data: {},
        headers: {},
        status: 202,
        statusText: "Accepted",
      });

      const params = basicDeliveryParams(
        {
          apiKey: API_KEY_VALUE,
          fromAddress: FROM_EMAIL_ADDRESS,
        },
        {
          profile: {
            email: TO_EMAIL_ADDRESS,
          },
        }
      );

      await expect(sendHandler(params, TEMPLATES)).resolves.toEqual({
        data: {},
        headers: {},
        status: 202,
        statusText: "Accepted",
      });

      expect(axiosSpy.mock.calls.length).toBe(1);
      const {
        data: { from, to },
        headers: { Authorization },
      } = axiosSpy.mock.calls[0][0];
      expect(Authorization).toBe(`Bearer ${API_KEY_VALUE}`);
      expect(from.email).toBe(FROM_EMAIL_ADDRESS);
      expect(from.name).toBe(undefined);
      expect(to).toEqual([
        {
          email: TO_EMAIL_ADDRESS,
        },
      ]);
    });
  });
});
