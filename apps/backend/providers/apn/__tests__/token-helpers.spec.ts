import { tokenStatusMapper } from "../token-helpers";

describe("apn tokenHelpers", () => {
  describe("tokenStatusMapper", () => {
    it("should return a list of token statuses based on apn response", () => {
      const tokens = ["token1", "token2", "token3", "token4", "token5"];
      const response = {
        failed: [
          {
            device: "token1",
            response: {
              reason: "BadDeviceToken",
            },
          },
          {
            device: "token2",
            response: {
              reason: "DeviceTokenNotForTopic",
            },
          },
          {
            device: "token3",
            response: {
              reason: "MissingDeviceToken",
            },
          },
          {
            device: "token4",
            response: {
              reason: "Unregistered",
            },
          },
        ],
      };
      const results = tokenStatusMapper(tokens, response);
      expect(results).toEqual([
        {
          token: "token1",
          status: "failed",
          reason: "BadDeviceToken",
        },
        {
          token: "token2",
          status: "failed",
          reason: "DeviceTokenNotForTopic",
        },
        {
          token: "token3",
          status: "failed",
          reason: "MissingDeviceToken",
        },
        {
          token: "token4",
          status: "failed",
          reason: "Unregistered",
        },
        {
          token: "token5",
          status: "active",
          reason: undefined,
        },
      ]);
    });
  });
});
