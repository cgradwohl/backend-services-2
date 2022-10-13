import axios from "axios";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { DEFAULT_PROVIDER_TIMEOUT_MS } from "~/providers/lib/constants";
import sendHandler from "~/providers/mailjet/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios", () => {
  return {
    post: jest.fn(),
  };
});

const mockAxios = axios as jest.Mocked<typeof axios>;

const getDeliveryParams = (
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

describe("mailjet provider", () => {
  describe("send", () => {
    const profile = {
      email: "to@mail.com",
    };

    const config = {
      fromEmail: "mockFromEmail",
      fromName: "mockFromName",
      privateKey: "mockPrivateKey",
      publicKey: "mockPublicKey",
    };

    const params = getDeliveryParams(config, {
      profile,
    });

    const template = {
      bcc: "bcc@mail.com",
      cc: "cc@mail.com",
      from: "from@mail.com",
      html: "",
      replyTo: "replyTo@mail.com",
      subject: "",
      text: "",
    };

    beforeEach(async () => jest.resetAllMocks());

    it("calls axios post with correct arguments", async () => {
      mockAxios.post.mockResolvedValue({ data: { success: true } });
      await sendHandler(params, template);
      expect(mockAxios.post).toHaveBeenCalledWith(
        "https://api.mailjet.com/v3/send",
        {
          Bcc: template.bcc,
          Cc: template.cc,
          FromEmail: template.from,
          FromName: undefined,
          Subject: "",
          "Html-part": "",
          "Text-part": "",
          To: profile.email,
          Headers: {
            "Reply-To": template.replyTo,
          },
        },
        {
          timeout: DEFAULT_PROVIDER_TIMEOUT_MS,
          headers: {
            "Content-Type": "application/json",
          },
          auth: {
            username: config.publicKey,
            password: config.privateKey,
          },
        }
      );
    });
  });
});
