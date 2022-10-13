import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import awsSes from "~/providers/aws-ses";
import sendHandler from "~/providers/aws-ses/send";
import { DeliveryHandlerParams } from "~/providers/types";

const mockSend = jest.fn();

jest.mock("aws-sdk", () => {
  return {
    // tslint:disable-next-line: only-arrow-functions object-literal-shorthand
    SES: function () {
      return { sendRawEmail: mockSend };
    },
  };
});

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
      provider: "aws-ses",
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

describe("aws-ses provider", () => {
  describe("send", () => {
    afterEach(jest.clearAllMocks);

    it("should require an access id", async () => {
      const params = basicDeliveryParams();
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Access Key ID specified."
      );
    });

    it("should require an access secret", async () => {
      const params = basicDeliveryParams({
        accessKeyId: "abc",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No Secret Key specified."
      );
    });

    it("should fail if region has an invalid type", async () => {
      const params = basicDeliveryParams({
        accessKeyId: "abc",
        region: ["makesNoSense"],
        secretAccessKey: "123",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "Invalid region type"
      );
    });

    it("should fail if region is not supported (old region type: object)", async () => {
      const params = basicDeliveryParams({
        accessKeyId: "abc",
        region: { label: "foo", value: "bar" },
        secretAccessKey: "123",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "Specified region bar is invalid. See https://docs.aws.amazon.com/general/latest/gr/rande.html#region-names-codes."
      );
    });

    it("should fail if region is not supported (new region type: string)", async () => {
      const params = basicDeliveryParams({
        accessKeyId: "abc",
        region: "bar",
        secretAccessKey: "123",
      });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "Specified region bar is invalid. See https://docs.aws.amazon.com/general/latest/gr/rande.html#region-names-codes."
      );
    });

    it("will send with correct from and to email addresses", async () => {
      mockSend.mockReturnValue({ promise: () => null });
      const params = basicDeliveryParams(
        {
          accessKeyId: "abc",
          region: "eu-west-1",
          secretAccessKey: "123",
        },
        {
          profile: {
            email: "foo@bar.com",
          },
        }
      );
      const templates = { plain: "", from: "admin@bar.com" };

      await sendHandler(params, templates);

      const sendCall = mockSend.mock.calls[0][0];

      expect(sendCall.RawMessage.Data).toContain("From: admin@bar.com");
      expect(sendCall.RawMessage.Data).toContain("To: foo@bar.com");
    });
  });

  describe("handles", () => {
    it("should return true when provided an email address", () => {
      expect(
        awsSes.handles({
          config: {} as any,
          profile: { email: "foo@bar.com" },
        })
      ).toEqual(true);
    });

    it("should require email address", () => {
      expect(
        awsSes.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
  });
});
