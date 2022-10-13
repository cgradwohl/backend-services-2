import axios from "axios";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import onesignalEmail from "~/providers/onesignal-email";
import sendHandler from "~/providers/onesignal-email/send";
import { DeliveryHandlerParams } from "~/providers/types";

jest.mock("axios", () => {
  return {
    create: jest.fn(),
  };
});

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

describe("onesignal-email provider", () => {
  describe("send", () => {
    let postStub;
    const profile = {
      email: "to@mail.com",
    };

    const config = {
      apiKey: "mockApiKey",
      appId: "mockAppId",
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

    beforeEach(async () => {
      postStub = jest.fn();
      (axios.create as jest.Mock).mockReturnValue({
        post: postStub,
      });

      postStub.mockReturnValue(Promise.resolve({}));

      await sendHandler(params, template);
    });

    it("call with correct keys", () => {
      expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({
        baseURL: "https://onesignal.com/api/v1",
        headers: {
          Authorization: `Basic ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
        timeoutErrorMessage: "OneSignal Email API request timed out.",
      });
    });

    it("should apply email addresses", () => {
      expect(postStub.mock.calls[0]).toEqual([
        "/notifications",
        {
          app_id: config.appId,
          email_body: "",
          email_subject: "",
          include_email_tokens: [profile.email],
        },
      ]);
    });
  });

  describe("handles", () => {
    it("should return true when provided an email", () => {
      expect(
        onesignalEmail.handles({
          config: {} as any,
          profile: { email: "test@courier.com" },
        })
      ).toEqual(true);
    });

    it("should require email", () => {
      expect(
        onesignalEmail.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
  });
});
