import axios from "axios";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import messagemedia from "~/providers/messagemedia";
import sendHandler from "~/providers/messagemedia/send";
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

describe("handles", () => {
  it("should return true when provided an phone_number", () => {
    expect(
      messagemedia.handles({
        config: {} as any,
        profile: { phone_number: "+11234567890" },
      })
    ).toEqual(true);
  });

  it("should require phone number", () => {
    expect(
      messagemedia.handles({
        config: {} as any,
        profile: {},
      })
    ).toEqual(false);
  });
});

describe("messagemedia-sms provider", () => {
  describe("send", () => {
    afterEach(jest.resetAllMocks);

    it("should require an api key", async () => {
      const params = basicDeliveryParams();
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Key specified."
      );
    });

    it("should require an api secret", async () => {
      const params = basicDeliveryParams({ apiKey: "adfasdqsd" });
      const templates = { plain: "" };
      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No API Secret specified."
      );
    });

    it("should respect the params", async () => {
      const response = {
        data: {
          messages: [
            {
              content: "Hello from Argo!",
            },
          ],
        },
      };
      (axios as any).mockResolvedValue(response);

      const params = basicDeliveryParams(
        {
          apiKey: "ArgoLovesToHoldTheKeys",
          apiSecret: "ArgoHatesToKeepTheSecret",
        },
        {
          profile: {
            phone_number: "+14156236302",
          },
        }
      );
      const templates = { plain: "Hello from Argo!" };

      await expect(sendHandler(params, templates)).resolves.toHaveProperty(
        "data",
        {
          messages: [
            {
              content: "Hello from Argo!",
            },
          ],
        }
      );
    });
  });
});
