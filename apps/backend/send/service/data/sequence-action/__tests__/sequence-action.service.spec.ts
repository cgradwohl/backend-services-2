import { SequenceActions } from "~/api/send/types";
import { sequenceActions } from "../../index";

const mock_dynamo_put = jest.fn();
const mock_dynamo_query = jest.fn(() => ({
  Items: [
    {
      filePath: "mock",
      nextSequenceActionId: "mock",
      prevSequenceActionId: "mock",
      requestId: "mock",
      sequenceId: "mock",
      sequenceActionId: "mock",
      triggerId: "mock",
      workspaceId: "mock",
    },
  ],
}));
const mock_s3_put = jest.fn();
const mock_s3_get = jest.fn();
jest.mock("~/lib/dynamo", () => {
  return {
    put: jest.fn(() => mock_dynamo_put()),
    query: jest.fn(() => mock_dynamo_query()),
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

describe("Sequence Action Data Service", () => {
  test("create", async () => {
    await sequenceActions("wxyz").create({
      requestId: "mock",
      sequenceId: "mock",
      triggerId: "mock",
      sequence: [
        {
          action: SequenceActions.send,
          message: {
            to: {
              email: "foo@bar.com",
            },
            content: {
              title: "foo",
              body: "bar",
            },
          },
        },
        {
          action: SequenceActions.send,
          message: {
            to: {
              email: "foo@bar.com",
            },
            content: {
              title: "foo",
              body: "bar",
            },
          },
        },
        {
          action: SequenceActions.send,
          message: {
            to: {
              email: "foo@bar.com",
            },
            content: {
              title: "foo",
              body: "bar",
            },
          },
        },
      ],
    });

    expect(mock_s3_put).toHaveBeenCalledTimes(3);
    expect(mock_dynamo_put).toHaveBeenCalledTimes(3);
  });

  test("getPayloadById", async () => {
    await sequenceActions("wxyz").getPayloadById("abcd");

    expect(mock_s3_get).toHaveBeenCalledTimes(1);
    expect(mock_dynamo_query).toHaveBeenCalledTimes(1);
  });
});
