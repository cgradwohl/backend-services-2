import { SequenceActions } from "~/api/send/types";
import { sequences } from "../../index";

const mock_dynamo_put = jest.fn();
const mock_dynamo_getItem = jest.fn(() => ({
  Item: {
    filePath: "mock",
    parentSequenceId: "mock",
    requestId: "mock",
    sequenceId: "mock",
    triggerId: "mock",
    workspaceId: "mock",
  },
}));
const mock_s3_put = jest.fn();
const mock_s3_get = jest.fn(() => ({
  sequence: {},
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

describe("Sequence Data Service", () => {
  test("create", async () => {
    await sequences("wxyz").create({
      parentSequenceId: "mock",
      requestId: "mock",
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

    expect(mock_s3_put).toHaveBeenCalledTimes(1);
    expect(mock_dynamo_put).toHaveBeenCalledTimes(1);
  });

  test("getPayload", async () => {
    await sequences("wxyz").getPayload({
      requestId: "mock",
      sequenceId: "mock",
    });

    expect(mock_dynamo_getItem).toHaveBeenCalledTimes(1);
    expect(mock_s3_get).toHaveBeenCalledTimes(1);
  });
});
