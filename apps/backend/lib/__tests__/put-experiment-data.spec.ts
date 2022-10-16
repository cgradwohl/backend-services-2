const mockPutRecord = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue(undefined),
});

jest.mock("~/lib/get-environment-variable");

jest.mock("aws-sdk", () => {
  return {
    Firehose: function () {
      return {
        putRecord: mockPutRecord,
      };
    },
  };
});

import putExperimentData from "../experiments/put-experiment-data";
import getEnvVar from "../get-environment-variable";

describe("Experiment Data Firehose", async () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should successfully put data into firehose", async () => {
    process.env.EXPERIMENTS_FIREHOSE_STREAM = "MOCK_EXPERIMENTS_FIREHOSE_NAME";
    const mockData = {
      event_name: "mockExperiment",
      event_params: {
        experiment: "mockExperiment",
        feature_flag: "mockFeatureFlag",
        tenantId: "mockTenantId",
        timestamp: new Date().toISOString(),
        user_id: "mockUserId",
        variation: "mockVariation",
      },
    };

    await putExperimentData(
      "mockExperiment",
      "mockFeatureFlag",
      "mockTenantId",
      mockData.event_params.timestamp,
      "mockUserId",
      "mockVariation"
    );
    expect(mockPutRecord).toBeCalledWith({
      DeliveryStreamName: getEnvVar("EXPERIMENTS_FIREHOSE_STREAM"),
      Record: {
        Data: JSON.stringify(mockData),
      },
    });
  });
});
