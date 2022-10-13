import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import awsSns from "~/providers/aws-sns";
import sendHandler from "~/providers/aws-sns/send";
import { DeliveryHandlerParams } from "~/providers/types";

const mockPublish = jest.fn();

jest.mock("aws-sdk", () => {
  return {
    // tslint:disable-next-line: only-arrow-functions object-literal-shorthand
    SNS: function () {
      return { publish: mockPublish };
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
      provider: "aws-sns",
    },
    linkHandler,
    profile: body.profile,
    variableData,
    variableHandler,
  };
};

describe("aws-sns provider", () => {
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

    it("should fail to send if nothing is provided", async () => {
      const params = basicDeliveryParams(
        {
          accessKeyId: "abc",
          secretAccessKey: "123",
          topicArn: "",
        },
        {
          profile: {},
        }
      );
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "Invalid SNS destination. SNS requires a valid or Phone Number, Target ARN, or Topic ARN."
      );
    });

    it("will publish with phone_number", async () => {
      mockPublish.mockReturnValue({ promise: () => null });
      const params = basicDeliveryParams(
        {
          accessKeyId: "abc",
          secretAccessKey: "123",
          topicArn: "",
        },
        {
          profile: {
            phone_number: "+1234567",
          },
        }
      );
      const templates = { plain: "" };

      await sendHandler(params, templates);

      expect(mockPublish.mock.calls[0][0]).toStrictEqual({
        Message: "",
        PhoneNumber: "+1234567",
        TargetArn: undefined,
        TopicArn: undefined,
      });
    });

    it("will publish with topic arn", async () => {
      mockPublish.mockReturnValue({ promise: () => null });
      const params = basicDeliveryParams(
        {
          accessKeyId: "abc",
          secretAccessKey: "123",
          topicArn: "topic-arn",
        },
        {
          profile: {
            phone_number: "",
          },
        }
      );
      const templates = { plain: "" };

      await sendHandler(params, templates);

      expect(mockPublish.mock.calls[0][0]).toStrictEqual({
        Message: "",
        PhoneNumber: undefined,
        TargetArn: undefined,
        TopicArn: "topic-arn",
      });
    });

    it("will publish with target arn", async () => {
      mockPublish.mockReturnValue({ promise: () => null });
      const params = basicDeliveryParams(
        {
          accessKeyId: "abc",
          secretAccessKey: "123",
          topicArn: "",
        },
        {
          profile: {
            aws_sns: { target_arn: "target-arn" },
            phone_number: "",
          },
        }
      );
      const templates = { plain: "" };

      await sendHandler(params, templates);

      expect(mockPublish.mock.calls[0][0]).toStrictEqual({
        Message: "",
        PhoneNumber: undefined,
        TargetArn: "target-arn",
        TopicArn: undefined,
      });
    });
  });

  describe("handles", () => {
    it("should return true when provided an phone_number", () => {
      expect(
        awsSns.handles({
          config: {} as any,
          profile: { phone_number: "+11234567890" },
        })
      ).toEqual(true);
    });

    it("should return true when provided an topicArn in config", () => {
      expect(
        awsSns.handles({
          config: { json: { topicArn: "i:am:arn" } } as any,
          profile: {},
        })
      ).toEqual(true);
    });

    it("should return true when provided an target_arn", () => {
      expect(
        awsSns.handles({
          config: {} as any,
          profile: { aws_sns: { target_arn: "i:am:arn" } },
        })
      ).toEqual(true);
    });

    it("should require phone number", () => {
      expect(
        awsSns.handles({
          config: {} as any,
          profile: {},
        })
      ).toEqual(false);
    });
  });
});
