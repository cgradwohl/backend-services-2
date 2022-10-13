import { put as mockPut } from "~/lib/dynamo";
import { create } from "~/lib/dynamo/event-logs";
import { sizeInWriteCapacityUnits } from "~/lib/object-size";
import mockJsonStore from "~/lib/s3";

const mockS3Put = (mockJsonStore as jest.Mock)().put;

const MOCK_DATE_TIME = 1482363367071;
const MOCK_GET_MILLISECONDS = 71;
const MOCK_MESSAGE_ID = "MOCK_MESSAGE_ID";
const MOCK_TENANT_ID = "MOCK_TENANT_ID";

// set a hard coded date time for testing purposes
jest.spyOn(Date, "now").mockImplementation(() => MOCK_DATE_TIME);
jest
  .spyOn(Date.prototype, "getMilliseconds")
  .mockReturnValue(MOCK_GET_MILLISECONDS);
jest.mock("nanoid", () => ({
  nanoid: () => "MOCK_NANO_ID",
}));

jest.mock("~/lib/object-size", () => ({
  sizeInWriteCapacityUnits: jest.fn().mockReturnValue(1),
}));

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});
jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/s3", () => {
  const put = jest.fn();

  return jest.fn(() => ({
    put,
  }));
});
jest.mock("~/lib/dynamo", () => {
  const id = jest.fn().mockReturnValue("MOCK_ID");
  const put = jest.fn();

  return {
    id,
    put,
  };
});

describe("when creating an event log", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should write to dynamo when consumed write capacity units are 1", async () => {
    await create(MOCK_TENANT_ID, MOCK_MESSAGE_ID, "event:received", {});

    expect(mockPut as jest.Mock).toBeCalledWith({
      Item: {
        id: "MOCK_ID",
        json: "{}",
        messageId: MOCK_MESSAGE_ID,
        tenantId: MOCK_TENANT_ID,
        timestamp: MOCK_DATE_TIME,
        type: "event:received",
      },
      TableName: "EVENT_LOGS_TABLE_NAME",
    });

    expect(mockS3Put).not.toBeCalled();
  });

  it("should write to dynamo and s3 when consumed write capacity units are greater than 1", async () => {
    (sizeInWriteCapacityUnits as jest.Mock).mockReturnValue(2);
    await create(MOCK_TENANT_ID, MOCK_MESSAGE_ID, "event:received", {
      extra: "data",
    });

    expect(mockPut as jest.Mock).toBeCalledWith({
      Item: {
        id: "MOCK_ID",
        json: {
          path: `${MOCK_GET_MILLISECONDS}/MOCK_NANO_ID/MOCK_TENANT_ID-MOCK_MESSAGE_ID_event_received_${MOCK_DATE_TIME}.json`,
          type: "S3",
        },
        messageId: MOCK_MESSAGE_ID,
        tenantId: MOCK_TENANT_ID,
        timestamp: MOCK_DATE_TIME,
        type: "event:received",
      },
      TableName: "EVENT_LOGS_TABLE_NAME",
    });

    expect(mockS3Put).toBeCalledWith(
      `${MOCK_GET_MILLISECONDS}/MOCK_NANO_ID/MOCK_TENANT_ID-MOCK_MESSAGE_ID_event_received_${MOCK_DATE_TIME}.json`,
      { extra: "data" }
    );
  });
});
