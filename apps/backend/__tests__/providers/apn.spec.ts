import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import apn from "~/providers/apn";
import sendHandler from "~/providers/apn/send";
import { ProviderResponseError } from "~/providers/errors";
import { DeliveryHandlerParams } from "~/providers/types";

const deliveryParams = (
  apnProfile: any = {},
  config?: any,
  override?: any,
  data?: any
): DeliveryHandlerParams => {
  const variableData = {
    data: { isBodyData: true, ...data },
    event: "",
    profile: { apn: apnProfile },
    recipient: "",
  };
  const variableHandler = createVariableHandler({
    value: variableData,
  }).getScoped("data");
  const linkHandler = createLinkHandler({});

  return {
    config: {
      ...config,
      provider: "",
    },
    linkHandler,
    override,
    profile: variableData.profile,
    variableData,
    variableHandler,
  };
};

describe("APN provider", () => {
  describe("handles", () => {
    it("should return true when provided an APN token", () => {
      expect(
        apn.handles({
          config: {} as any,
          profile: { apn: { tokens: ["APNToken"] } },
        })
      ).toEqual(true);
    });

    it("should allow a single token string", () => {
      expect(
        apn.handles({
          config: {} as any,
          profile: { apn: { tokens: "APNToken" } },
        })
      ).toEqual(true);
    });

    it("should allow a single token string on token property", () => {
      expect(
        apn.handles({
          config: {} as any,
          profile: { apn: { token: "APNToken" } },
        })
      ).toEqual(true);
    });

    [{}, 1234567890, ["APNToken"]].forEach((testCase) => {
      it(`should throw an error if a single token is ${testCase}`, () => {
        expect(() =>
          apn.handles({
            config: {} as any,
            profile: { apn: { token: testCase } },
          })
        ).toThrow(ProviderResponseError);
      });
    });

    it("should allow both token and tokens", () => {
      expect(
        apn.handles({
          config: {} as any,
          profile: {
            apn: {
              token: "APNToken",
              tokens: "APNToken",
            },
          },
        })
      ).toEqual(true);
    });

    it("should check for stored tokens", () => {
      expect(
        apn.handles({
          config: {} as any,
          profile: {},
          tokensByProvider: { apn: [{ token: "APNToken" } as any] },
        })
      ).toEqual(true);

      expect(
        apn.handles({
          config: {} as any,
          profile: {},
          tokensByProvider: { apn: [] },
        })
      ).toEqual(false);
    });

    it("should require an APN token", () => {
      expect(
        apn.handles({
          config: {} as any,
          profile: {},
        })
      ).toBe(false);
    });

    it("should require APN tokens with at least one token", () => {
      expect(
        apn.handles({
          config: {} as any,
          profile: { apn: { tokens: [] } },
        })
      ).toBe(false);
    });

    it("should throw an error if an APN token has a non string element", () => {
      expect(() =>
        apn.handles({
          config: {} as any,
          profile: { apn: { tokens: [1234567890] } },
        })
      ).toThrow(ProviderResponseError);
    });

    it("should throw an error if APN is not an object", () => {
      expect(() =>
        apn.handles({
          config: {} as any,
          profile: { apn: "APNToken" },
        })
      ).toThrow(ProviderResponseError);
    });

    it("should throw an error if apn.tokens is not an array", () => {
      expect(() =>
        apn.handles({
          config: {} as any,
          profile: { apn: { tokens: {} } },
        })
      ).toThrow(ProviderResponseError);
    });
  });

  describe("send", () => {
    afterEach(jest.clearAllMocks);

    it("should require a device token", async () => {
      const params = deliveryParams();
      const templates = { body: "", subtitle: "", title: "", topic: "" };

      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No device token specified."
      );
    });

    it("should require a key", async () => {
      const params = deliveryParams({
        token: "APNToken",
        tokens: "APNToken",
      });
      const templates = { body: "", subtitle: "", title: "", topic: "" };

      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No key specified."
      );
    });

    it("should require a key_id", async () => {
      const params = deliveryParams(
        {
          token: "APNToken",
          tokens: "APNToken",
        },
        {
          key: "key",
        }
      );
      const templates = { body: "", subtitle: "", title: "", topic: "" };

      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No `key_id` specified."
      );
    });

    it("should require a team_id", async () => {
      const params = deliveryParams(
        {
          token: "APNToken",
          tokens: "APNToken",
        },
        {
          key: "key",
          keyId: "keyId",
        }
      );
      const templates = { body: "", subtitle: "", title: "", topic: "" };

      await expect(sendHandler(params, templates)).rejects.toHaveProperty(
        "message",
        "No `team_id` specified."
      );
    });
  });
});
