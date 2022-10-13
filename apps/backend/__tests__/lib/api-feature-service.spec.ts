import apiFeatureService from "~/lib/api-feature-service";
import { getApiVersion } from "~/lib/authorizers";
import logger from "~/lib/logger";

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/dynamo", () => ({
  getItem: jest
    .fn()
    .mockResolvedValueOnce({
      Item: {
        variation: true,
      },
    })
    .mockResolvedValueOnce({
      Item: {
        variation: false,
      },
    })
    .mockRejectedValueOnce(
      new Error("I did not find the flag. Please contact BOKA")
    ),
}));

const errorLogSpy = jest.spyOn(logger, "error");

describe("apiFeatureService", () => {
  it("should get enabled as true from dynamo document when flag is turned on", async () => {
    const expectedApiVersion = "2021-11-01";

    const variation = await apiFeatureService(
      "test-feature"
    ).variation<boolean>("route_to_v2", false);

    const actualApiVersion = getApiVersion(variation);

    expect(actualApiVersion).toBe(expectedApiVersion);
  });
  it("should get enabled as false from dynamo document when flag is turned off", async () => {
    const expectedApiVersion = "2019-04-01";

    const variation = await apiFeatureService(
      "test-feature"
    ).variation<boolean>("route_to_v2", false);

    const actualApiVersion = getApiVersion(variation);

    expect(actualApiVersion).toBe(expectedApiVersion);
  });
  it("should catch exception, log the error and ", async () => {
    const expectedApiVersion = "2019-04-01";

    const variation = await apiFeatureService(
      "test-feature"
    ).variation<boolean>("route_to_v2", false);

    const actualApiVersion = getApiVersion(variation);

    expect(actualApiVersion).toBe(expectedApiVersion);

    expect(errorLogSpy).toHaveBeenCalledWith(
      "Error getting API Feature flag route_to_v2, Error: I did not find the flag. Please contact BOKA"
    );
  });
});
