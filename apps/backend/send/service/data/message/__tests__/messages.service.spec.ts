import { messages } from "../../index";

const mock_dynamo_put = jest.fn();
const mock_s3_put = jest.fn();
jest.mock("~/lib/dynamo", () => {
  return { put: jest.fn(() => mock_dynamo_put()) };
});
jest.mock("~/lib/s3", () => {
  return () => {
    return {
      put: jest.fn(() => mock_s3_put()),
    };
  };
});

jest.mock("~/lib/get-environment-variable");

describe("Messsage Data Service", () => {
  test("create", async () => {
    await messages("wxyz").create({
      requestId: "abcd",
      message: {
        to: {
          email: "foo@bar.com",
        },
        content: {
          title: "title",
          body: "body",
        },
      },
      jobId: undefined,
      sequenceId: undefined,
      sequenceActionId: undefined,
      triggerId: undefined,
      triggerEventId: undefined,
    });

    expect(mock_s3_put).toHaveBeenCalledTimes(1);
    expect(mock_dynamo_put).toHaveBeenCalledTimes(1);
  });
});
