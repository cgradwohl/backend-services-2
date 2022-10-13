import createVariableHandler from "~/lib/variable-handler";
import { IProviderConfiguration } from "~/send/types";
import { IChannel } from "~/types.api";
import { templateRouter } from "../template-router";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");

describe("templateRouter", () => {
  it("should not select multiple providers when a channel has providers configured", async () => {
    const channel: IChannel = {
      blockIds: ["544825c2-7411-4b0d-9d0b-bb68bb6f85c5"],
      config: {
        email: {
          emailSubject: "Duplication Test",
          emailTemplateConfig: {
            templateName: "line",
            topBarColor: "#9121C2",
          },
          isUsingTemplateOverride: false,
        },
        locales: {},
      },
      id: "c0ea8e4e-bead-459e-81a4-1860787c5a9e",
      providers: [
        {
          configurationId: "bfcb2dc6-6774-4642-af70-920674639f3f",
          key: "gmail",
        },
        {
          configurationId: "b46abb6b-e99e-473b-927a-7d9843ec0442",
          key: "mailjet",
        },
      ],
      taxonomy: "email:*",
      disabled: false,
      label: "",
    };

    const result = await templateRouter(
      [channel],
      "",
      providers as any,
      createVariableHandler({
        value: {
          profile: {
            email: "drew@courier.com",
          },
        },
      })
    );

    expect(result[0].provider).toBe("gmail");
    expect(result[0].selected).toBe(true);
    expect(result[1].provider).toBe("mailjet");
    expect(result[1].selected).toBe(false);
  });
});

const providers: { [id: string]: Partial<IProviderConfiguration> } = {
  "b46abb6b-e99e-473b-927a-7d9843ec0442": {
    json: {
      publicKey: "",
      privateKey: "",
      fromEmail: "support@trycourier.com",
      fromName: "Courier Support",
      provider: "mailjet",
    },
    id: "b46abb6b-e99e-473b-927a-7d9843ec0442",
  },
  "bfcb2dc6-6774-4642-af70-920674639f3f": {
    updater: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    updated: 1639019685241,
    creator: "1b2e839f-f4bb-4fc6-a2da-a727789b8e97",
    tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
    created: 1639019685241,
    json: {
      publicKey: "",
      privateKey: "",
      fromEmail: "support@trycourier.com",
      fromName: "Courier Support",
      provider: "gmail",
    },
    id: "bfcb2dc6-6774-4642-af70-920674639f3f",
  },
};
