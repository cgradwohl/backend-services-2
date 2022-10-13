import {
  getRoutingStrategyPrefix,
  getMessageRoutingStrategyFilePath,
} from "../routing-strategy-store-helpers";

const tenantId1 = "0d2e12d7-3cb5-4b98-9d29-2d2b48c86a21";
const tenantId2 = "27bd3cbe-de50-4f51-97e9-717cee26eba9";
const tenantId3 = "691f64ec-308b-4f5e-a26e-de920a3d6998";

describe("routing strategy store helpers", () => {
  describe("getRoutingStrategyPrefix", () => {
    it("should return a three digit number", () => {
      const hash = getRoutingStrategyPrefix(tenantId1);
      expect(hash.length).toBe(3);
      expect(hash).toMatch(/^[a-f0-9]{3}$/);
    });

    it("should be predictable", () => {
      expect(getRoutingStrategyPrefix(tenantId1)).toBe("b02");
      expect(getRoutingStrategyPrefix(tenantId2)).toBe("00d");
      expect(getRoutingStrategyPrefix(tenantId3)).toBe("517");
    });
  });

  describe("getMessageRoutingStrategyFilePath", () => {
    it("should return the correct filePath", () => {
      const filePath = getMessageRoutingStrategyFilePath(tenantId1);
      expect(filePath).toBe(`b02/${tenantId1}_default_routing_strategy.json`);
    });
  });
});
