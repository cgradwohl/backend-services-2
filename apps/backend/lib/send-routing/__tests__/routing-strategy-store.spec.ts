import {
  getSendRoutingStrategy,
  putSendRoutingStrategy,
} from "../routing-strategy-store";
import { RoutingStrategy } from "../types";

const mockPut = jest.fn();
const mockGet = jest.fn();
const mockGetMessageRoutingStrategyFilePath = jest.fn();

jest.mock("~/lib/s3", () => () => ({
  put: (...args) => mockPut(...args),
  get: (...args) => mockGet(...args),
}));

jest.mock("../lib/routing-strategy-store-helpers", () => ({
  getMessageRoutingStrategyFilePath: () =>
    mockGetMessageRoutingStrategyFilePath(),
}));

describe("send routing store", () => {
  const OLD_ENV = { ...process.env };
  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      SEND_ROUTING_STRATEGY_BUCKET: "SEND_ROUTING_STRATEGY_BUCKET_NAME",
    };
    jest.resetAllMocks();
    jest.resetModules();
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe("getSendRoutingStrategy", () => {
    it("gets a default send routing", async () => {
      const tenantId = "123";
      const getResolveValue = {
        routing: {},
        channels: {},
        providers: {},
      };
      mockGet.mockResolvedValue(getResolveValue);
      mockGetMessageRoutingStrategyFilePath.mockReturnValue("path");

      expect(await getSendRoutingStrategy({ tenantId })).toMatchObject(
        getResolveValue
      );
      expect(mockGet).toHaveBeenCalledWith("path");
    });
  });

  describe("putDefaultSendRouting", () => {
    it("puts a send routing strategy", async () => {
      const tenantId = "123";
      const strategy: RoutingStrategy = {
        routing: { method: "all", channels: ["email"] },
        channels: {},
        providers: {},
      };
      mockGetMessageRoutingStrategyFilePath.mockReturnValue("path");

      await putSendRoutingStrategy({ tenantId, strategy });
      expect(mockPut).toHaveBeenCalledTimes(1);
      expect(mockPut).toHaveBeenCalledWith("path", strategy);
    });
  });
});
