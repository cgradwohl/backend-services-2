import { get as getTenant } from "~/lib/tenant-service";
import { isCustomTierTenantId } from "~/lib/plan-pricing";

jest.mock("~/lib/tenant-service");
const getTenantMock = getTenant as jest.Mock;
const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
});

afterEach(() => {
  process.env = OLD_ENV;
});

describe("plan matching", () => {
  let findPricingPlan;
  describe("production", () => {
    beforeEach(() => {
      process.env.STAGE = "production";
      findPricingPlan = require("../../lib/plan-pricing").findPricingPlan;
    });

    it("should return 'good' by default", () => {
      expect(findPricingPlan(null)).toBe("good");
    });

    it("should return good", () => {
      expect(findPricingPlan("price_1HWTkBC1P6cM0F5Krbx2Xs3W")).toBe("good");
    });

    it("should return better", () => {
      expect(findPricingPlan("price_1J0ADDC1P6cM0F5K2tOj5UJS")).toBe("better");
      expect(findPricingPlan("price_1HWTl1C1P6cM0F5K6pqyxuvx")).toBe("better");
    });

    it("should return custom", () => {
      expect(findPricingPlan("price_1HWTmSC1P6cM0F5KZFz77DBU")).toBe("custom");
      expect(findPricingPlan("price_Custom")).toBe("custom");
    });
  });

  describe("test", () => {
    beforeEach(() => {
      findPricingPlan = require("../../lib/plan-pricing").findPricingPlan;
    });

    it("should return 'good' by default", () => {
      expect(findPricingPlan(null)).toBe("good");
    });

    it("should return good", () => {
      expect(findPricingPlan("price_1HVlSeC1P6cM0F5KntjktDfN")).toBe("good");
    });

    it("should return better", () => {
      expect(findPricingPlan("price_1HV2DdC1P6cM0F5KRGocJ3Dl")).toBe("better");
    });

    it("should return custom", () => {
      expect(findPricingPlan("price_1HV2EIC1P6cM0F5KIuE5OwQg")).toBe("custom");
      expect(findPricingPlan("price_Custom")).toBe("custom");
    });
  });
});

describe("price map", () => {
  let prices;
  describe("production", () => {
    beforeEach(() => {
      process.env.STAGE = "production";
      prices = require("../../lib/plan-pricing").prices;
    });

    it("should return pricing map", () => {
      expect(prices).toStrictEqual({
        better: "price_1J0ADDC1P6cM0F5K2tOj5UJS",
        good: "price_1HWTkBC1P6cM0F5Krbx2Xs3W",
      });
    });
  });

  describe("test", () => {
    beforeEach(() => {
      prices = require("../../lib/plan-pricing").prices;
    });

    it("should return pricing map", () => {
      expect(prices).toStrictEqual({
        better: "price_1HV2DdC1P6cM0F5KRGocJ3Dl",
        good: "price_1HVlSeC1P6cM0F5KntjktDfN",
      });
    });
  });
});

describe("isCustomTierTenantId", () => {
  afterEach(jest.clearAllMocks);

  it("should return true for custom payment tiers", async () => {
    expect.assertions(1);
    getTenantMock.mockResolvedValue({
      stripeSubscriptionItemPriceId: "custom",
    });
    const result = await isCustomTierTenantId("boop");
    expect(result).toEqual(true);
  });

  it("should return false for good payment tier", async () => {
    expect.assertions(1);
    getTenantMock.mockResolvedValue({
      stripeSubscriptionItemPriceId: "price_1HVlSeC1P6cM0F5KntjktDfN",
    });
    const result = await isCustomTierTenantId("boop");
    expect(result).toEqual(false);
  });

  it("should return false for better payment tier", async () => {
    expect.assertions(1);
    getTenantMock.mockResolvedValue({
      stripeSubscriptionItemPriceId: "price_1HV2DdC1P6cM0F5KRGocJ3Dl",
    });
    const result = await isCustomTierTenantId("boop");
    expect(result).toEqual(false);
  });
});
