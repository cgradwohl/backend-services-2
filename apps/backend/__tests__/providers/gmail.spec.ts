import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import gmail from "~/providers/gmail";
import resolveOverrides from "~/providers/gmail/resolve-overrides";
import sendHandler from "~/providers/gmail/send";
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
      provider: "",
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

describe.only("gmail provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an access token", async () => {
      const params = basicDeliveryParams({
        refresh_token: "a-refresh_token",
        fromEMail: "from@email.com",
        profile: {
          email: "to@email.com",
        },
      });

      const templates = {
        bcc: "bcc@mail.com",
        cc: "cc@mail.com",
        from: "from@mail.com",
        html: "",
        replyTo: "replyTo@mail.com",
        subject: "",
        text: "",
      };

      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Access Token present."
      );
    });

    it("should resolve override params", async () => {
      const templates = {
        bcc: "bcc@mail.com",
        cc: "cc@mail.com",
        from: "from@mail.com",
        fromName: "fromName",
        html: "",
        replyTo: "replyTo@mail.com",
        subject: "",
        text: "",
      };

      const override = {
        bcc: "bccOverride@gmail.com",
        cc: "ccOverride@gmail.com",
        subject: "subject override",
        replyTo: "replyToOverride@gmail.com",
      };

      const resolvedParams = resolveOverrides(
        templates.bcc,
        templates.cc,
        templates.fromName,
        templates.replyTo,
        templates.subject,
        templates.text,
        override
      );

      await expect(resolvedParams).toEqual({
        bcc: "bccOverride@gmail.com",
        cc: "ccOverride@gmail.com",
        fromName: "fromName",
        replyTo: "replyToOverride@gmail.com",
        subject: "subject override",
        text: "",
      });
    });
  });

  describe("handles", () => {
    it("should return true when email attribute is correctly passed", () => {
      expect(
        gmail.handles({
          config: {} as any,
          profile: {
            email: "to@email.com",
          },
        })
      ).toEqual(true);
    });
    it("should return false when email is not passed", () => {
      expect(
        gmail.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
  });
});
