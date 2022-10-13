import { createMetricsLogger } from "aws-embedded-metrics";
import {
  decodeClientKey,
  getBearerTokenFromAuthEvent,
  isDeliveryMetered,
  isTranslateMetered,
  validateFlags,
  validateDeliveryFlags,
} from "../lib";
import * as Lib from "../lib";
import uuid from "uuid/v4";

describe("authorizers lib", () => {
  describe("getBearerTokenFromAuthEvent", () => {
    it("should handle token and request auth event types", () => {
      const event: any = {
        type: "TOKEN",
        authorizationToken: "token",
      };
      expect(getBearerTokenFromAuthEvent(event)).toBe("token");

      const event2: any = {
        type: "REQUEST",
        headers: {
          Authorization: "token",
        },
      };
      expect(getBearerTokenFromAuthEvent(event2)).toBe("token");
    });
  });

  describe("decodeClientKey", () => {
    it("should decode client key", () => {
      expect(
        decodeClientKey(
          "MDM4YmEyMmUtZTY0MS00YTU2LWExYmYtNDYzYzgxYzY1ZWYyL3Rlc3Q="
        )
      ).toEqual({
        tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
        env: "test",
        decodedId: "038ba22e-e641-4a56-a1bf-463c81c65ef2/test",
      });
    });
  });

  describe("isTranslateMetered", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it.each([
      [100, true],
      [0, false],
    ])("should return %1 if the percentage is %0", async (value, result) => {
      expect(
        await isTranslateMetered({
          percent: value,
          tenantId: "test-tenant",
          awsRequestId: "014a1a1f-881f-4519-8137-e6b50266c9c6",
        })
      ).toStrictEqual(result);
      expect(createMetricsLogger().setDimensions).toHaveBeenCalledWith(
        { Function: "Metering" },
        { Function: "Metering", Type: "translation" }
      );
    });

    it.each([
      [100, true],
      [0, false],
    ])("should return %1 if the percentage is %0", async (value, result) => {
      expect(
        await isDeliveryMetered({
          percent: value,
          tenantId: "test-tenant",
          awsRequestId: "014a1a1f-881f-4519-8137-e6b50266c9c6",
        })
      ).toStrictEqual(result);
      expect(createMetricsLogger().setDimensions).toHaveBeenCalledWith(
        { Function: "Metering" },
        { Function: "Metering", Type: "delivery" }
      );
    });
  });

  describe("validateFlags", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("should default to metered if flags are undefined", async () => {
      const mock = jest.spyOn(Lib, "isTranslateMetered");
      mock.mockResolvedValue(true);

      const tenantId = uuid();
      const awsRequestId = uuid();
      const trafficPercentageToValidate = randomPercentage();

      expect(
        await validateFlags({
          allowTranslation: undefined,
          awsRequestId,
          blockTranslation: undefined,
          shouldTranslateAndDeliver: false,
          tenantId,
          trafficPercentageToValidate,
        })
      ).toStrictEqual(true);
      expect(mock).toBeCalledWith({
        percent: trafficPercentageToValidate,
        tenantId,
        awsRequestId,
      });
    });

    it("should return true for allowlist and no blocklist", async () => {
      const mock = jest.spyOn(Lib, "isTranslateMetered");
      mock.mockResolvedValue(true);

      const tenantId = uuid();
      const awsRequestId = uuid();
      const trafficPercentageToValidate = randomPercentage();

      expect(
        await validateFlags({
          allowTranslation: false,
          awsRequestId,
          blockTranslation: false,
          shouldTranslateAndDeliver: false,
          tenantId,
          trafficPercentageToValidate,
        })
      ).toStrictEqual(true);
      expect(mock).toBeCalledWith({
        percent: trafficPercentageToValidate,
        tenantId,
        awsRequestId,
      });
    });

    it("should return false for allowlist and blocklist", async () => {
      const mock = jest.spyOn(Lib, "isTranslateMetered");
      mock.mockResolvedValue(true);

      const tenantId = uuid();
      const awsRequestId = uuid();
      const trafficPercentageToValidate = randomPercentage();

      expect(
        await validateFlags({
          allowTranslation: true,
          awsRequestId,
          blockTranslation: true,
          shouldTranslateAndDeliver: false,
          tenantId,
          trafficPercentageToValidate,
        })
      ).toStrictEqual(false);

      expect(mock).toBeCalledTimes(0);
    });

    it("should return false for allowlist and blocklist", async () => {
      const mock = jest.spyOn(Lib, "isTranslateMetered");
      mock.mockResolvedValue(true);

      const tenantId = uuid();
      const awsRequestId = uuid();
      const trafficPercentageToValidate = randomPercentage();

      expect(
        await validateFlags({
          allowTranslation: false,
          awsRequestId,
          blockTranslation: true,
          shouldTranslateAndDeliver: false,
          tenantId,
          trafficPercentageToValidate,
        })
      ).toStrictEqual(false);

      expect(mock).toBeCalledTimes(0);
    });

    it.each([true, false])(
      "should return %p for allowlist and no blocklist",
      async (val) => {
        const mock = jest.spyOn(Lib, "isTranslateMetered");
        mock.mockResolvedValue(val);

        const tenantId = uuid();
        const awsRequestId = uuid();
        const trafficPercentageToValidate = randomPercentage();
        expect(
          await validateFlags({
            allowTranslation: false,
            awsRequestId,
            blockTranslation: false,
            shouldTranslateAndDeliver: false,
            tenantId,
            trafficPercentageToValidate,
          })
        ).toStrictEqual(val);
      }
    );
  });

  describe("validateDeliveryFlags", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("should default to false if flags are undefined", async () => {
      const mock = jest.spyOn(Lib, "isDeliveryMetered");
      mock.mockResolvedValue(true);

      const tenantId = uuid();
      const awsRequestId = uuid();
      const trafficPercentageToDeliver = randomPercentage();

      expect(
        await validateDeliveryFlags({
          allowTranslationAndDelivery: undefined,
          blockTranslationAndDelivery: undefined,
          tenantId,
          awsRequestId,
          trafficPercentageToDeliver,
        })
      ).toStrictEqual(false);
      expect(mock).not.toHaveBeenCalled();
    });

    it("should return true for allowlist and no blocklist", async () => {
      const mock = jest.spyOn(Lib, "isDeliveryMetered");
      mock.mockResolvedValue(true);

      const tenantId = uuid();
      const awsRequestId = uuid();
      const trafficPercentageToDeliver = randomPercentage();

      expect(
        await validateDeliveryFlags({
          allowTranslationAndDelivery: true,
          blockTranslationAndDelivery: false,
          tenantId,
          awsRequestId,
          trafficPercentageToDeliver,
        })
      ).toStrictEqual(true);
    });

    it("should return false for allowlist and blocklist", async () => {
      const mock = jest.spyOn(Lib, "isDeliveryMetered");
      mock.mockResolvedValue(true);

      const tenantId = uuid();
      const awsRequestId = uuid();
      const trafficPercentageToDeliver = randomPercentage();

      expect(
        await validateDeliveryFlags({
          allowTranslationAndDelivery: true,
          blockTranslationAndDelivery: true,
          tenantId,
          awsRequestId,
          trafficPercentageToDeliver,
        })
      ).toStrictEqual(false);
    });

    it("should return false for allowlist and blocklist", async () => {
      const mock = jest.spyOn(Lib, "isDeliveryMetered");
      mock.mockResolvedValue(true);

      const tenantId = uuid();
      const awsRequestId = uuid();
      const trafficPercentageToDeliver = randomPercentage();

      expect(
        await validateDeliveryFlags({
          allowTranslationAndDelivery: false,
          blockTranslationAndDelivery: true,
          tenantId,
          awsRequestId,
          trafficPercentageToDeliver,
        })
      ).toStrictEqual(false);
    });

    it.each([true, false])(
      "should return %p for allowlist and no blocklist",
      async (val) => {
        const mock = jest.spyOn(Lib, "isDeliveryMetered");
        mock.mockResolvedValue(val);

        const tenantId = uuid();
        const awsRequestId = uuid();
        const trafficPercentageToDeliver = randomPercentage();
        expect(
          await validateDeliveryFlags({
            allowTranslationAndDelivery: false,
            blockTranslationAndDelivery: false,
            tenantId,
            awsRequestId,
            trafficPercentageToDeliver,
          })
        ).toStrictEqual(val);
      }
    );
  });
});

const randomPercentage = () => Math.floor(Math.random() * 100) + 1;
