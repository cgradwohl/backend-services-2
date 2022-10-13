import uuid from "uuid";
import { putRecord } from "~/lib/kinesis/firehose";
import { handleRecord } from "~/triggers/kinesis/event-logs/data-retention/event-logs-firehose-pump";
import { ISafeEventLogEntry } from "~/types.internal";
import { getJsonValue } from "~/lib/dynamo/event-logs";

jest.mock("~/lib/capture-exception");
jest.mock("~/lib/dynamo/event-logs");
jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/kinesis/firehose");

const mockGetJsonValue = getJsonValue as jest.Mock;
const mockPutRecord = putRecord as jest.Mock;

describe("Handle record should unify event logs", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const createEvent = (
    body: string | { path: string; type: "S3" }
  ): ISafeEventLogEntry => ({
    id: uuid.v4(),
    json: body,
    messageId: uuid.v4(),
    tenantId: uuid.v4(),
    timestamp: Date.now(),
    type: "event:received",
  });

  it("should pump json record in to event log firehose", async () => {
    const json = { foo: "bar" };
    const event = createEvent(JSON.stringify(json));
    mockGetJsonValue.mockResolvedValue(json);

    await handleRecord(event);

    expect(mockPutRecord).toBeCalledWith({
      DeliveryStreamName: "EVENT_LOGS_FIREHOSE_STREAM",
      Record: {
        Data: JSON.stringify({ ...event, json }),
      },
    });
  });

  it("should truncate long string values larger than 10KB", async () => {
    const json = {
      truncated: "a".repeat(1024 * 10),
      intact: "b".repeat(1024 * 9),
    };
    const event = createEvent(JSON.stringify(json));
    mockGetJsonValue.mockResolvedValue(json);

    await handleRecord(event);

    expect(mockPutRecord).toBeCalledWith({
      DeliveryStreamName: "EVENT_LOGS_FIREHOSE_STREAM",
      Record: {
        Data: JSON.stringify({
          ...event,
          json: {
            truncated: `[Truncated] ${json.truncated.substring(0, 100)}...`,
            intact: json.intact,
          },
        }),
      },
    });
  });
});
