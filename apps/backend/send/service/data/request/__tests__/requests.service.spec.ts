import { requests } from "../../index";

const mock_dynamo_put = jest.fn();
const mock_dynamo_getItem = jest.fn(() => ({
  Item: {
    apiVersion: "mock",
    dryRunKey: "mock",
    filePath: "mock",
    jobId: "mock",
    requestId: "mock",
    scope: "mock",
    source: "mock",
    sequenceId: "mock",
    triggerId: "mock",
    workspaceId: "mock",
  },
}));
const mock_s3_put = jest.fn();
const mock_s3_get = jest.fn(() => ({
  request: {
    message: {},
  },
}));
jest.mock("~/lib/dynamo", () => {
  return {
    put: jest.fn(() => mock_dynamo_put()),
    getItem: jest.fn(() => mock_dynamo_getItem()),
  };
});
jest.mock("~/lib/s3", () => {
  return () => {
    return {
      put: jest.fn(() => mock_s3_put()),
      get: jest.fn(() => mock_s3_get()),
    };
  };
});

jest.mock("~/lib/get-environment-variable");

describe("Request Data Service", () => {
  test("create", async () => {
    await requests("wxyz").create({
      apiVersion: "2021-11-01",
      dryRunKey: "default",
      idempotencyKey: "mock",
      jobId: undefined,
      requestId: "abcd",
      request: {
        message: {
          to: {
            email: "foo@bar.com",
          },
          content: {
            title: "title",
            body: "body",
          },
        },
      },
      scope: "published/production",
      source: undefined,
      sequenceId: undefined,
      triggerId: undefined,
      translated: undefined,
    });

    expect(mock_s3_put).toHaveBeenCalledTimes(1);
    expect(mock_dynamo_put).toHaveBeenCalledTimes(1);
  });

  test("getPayload", async () => {
    await requests("wxyz").getPayload("abcd");

    expect(mock_dynamo_getItem).toHaveBeenCalledTimes(1);
    expect(mock_s3_get).toHaveBeenCalledTimes(1);
  });
});
