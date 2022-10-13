import { schedules } from "../index";

const mock_kinesis_putRecord = jest.fn();
const mock_dynamo_getItem = jest.fn(() => ({
  Item: {
    created: new Date().toISOString(),
    expiration: "mock",
    messageId: "mock",
    messageFilePath: "mock",
    requestId: "mock",
    scheduleJobId: "mock",
    updated: new Date().toISOString(),
    workspaceId: "mock",
    pk: "scheduleJob/1234",
    sk: "scheduleJob/1234",
  },
}));
jest.mock("~/lib/kinesis", () => {
  return {
    putRecord: jest.fn(() => mock_kinesis_putRecord()),
  };
});
jest.mock("~/lib/dynamo", () => {
  return {
    getItem: jest.fn(() => mock_dynamo_getItem()),
  };
});
jest.mock("~/lib/get-environment-variable");

describe("Schedule Service", () => {
  test("put", async () => {
    await schedules("mock").putJob({
      delay: {
        duration: "123",
      },
      messageFilePath: "mock",
      messageId: "mock",
      requestId: "mock",
    });

    expect(mock_kinesis_putRecord).toHaveBeenCalledTimes(1);
  });

  test("get", async () => {
    await schedules("mock").get("1234");
    expect(mock_dynamo_getItem).toHaveBeenCalledTimes(1);
  });
});
