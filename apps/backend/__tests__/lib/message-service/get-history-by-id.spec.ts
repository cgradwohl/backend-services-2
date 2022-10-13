import { getLogs as mockGetLogs } from "~/lib/dynamo/event-logs";
import { BadRequest } from "~/lib/http-errors";
import { Errors } from "~/lib/message-service/errors";
import getHistoryById from "~/lib/message-service/get-history-by-id";
import mapMock from "~/lib/message-service/map-message-history";
import { EventLogEntryType, IEventLogEntry } from "~/types.api";

jest.mock("~/lib/dynamo/event-logs", () => {
  return {
    getLogs: jest.fn(),
  };
});

jest.mock("~/lib/message-service/map-message-history", () => {
  return jest.fn();
});

const ID = "id";
const TENANT_ID = "tenant-id";

const createLog = (
  id: string,
  type: EventLogEntryType,
  timestamp: number
): IEventLogEntry => {
  return {
    id,
    json: {},
    messageId: ID,
    tenantId: TENANT_ID,
    timestamp,
    type,
  };
};

describe("when getting message history by id", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will throw if type is an unsupported Message History Type", async () => {
    await expect(getHistoryById(TENANT_ID, ID, "fake")).rejects.toThrow(
      BadRequest
    );
    expect((mockGetLogs as jest.Mock).mock.calls.length).toBe(0);
  });

  it("will throw if there are no event logs", async () => {
    (mockGetLogs as jest.Mock).mockResolvedValue([]);

    await expect(getHistoryById(TENANT_ID, ID, undefined)).rejects.toThrow(
      Errors.MessageNotFoundError
    );
    expect((mockGetLogs as jest.Mock).mock.calls.length).toBe(1);
    expect((mockGetLogs as jest.Mock).mock.calls[0][0]).toBe(TENANT_ID);
    expect((mockGetLogs as jest.Mock).mock.calls[0][1]).toBe(ID);
  });

  it("will return filtered logs if type passed as param", async () => {
    const logs: IEventLogEntry[] = [
      createLog("1", "event:received", 12345),
      createLog("2", "profile:loaded", 12346),
    ];
    (mapMock as jest.Mock).mockReturnValue({ ts: logs[1].timestamp });
    (mockGetLogs as jest.Mock).mockResolvedValue(logs);

    const result = await getHistoryById(TENANT_ID, ID, "PROFILE_LOADED");

    expect(result.length).toBe(1);
    expect((mapMock as jest.Mock).mock.calls.length).toBe(1);
    expect((mapMock as jest.Mock).mock.calls[0][0]).toMatchObject({
      type: "profile:loaded",
    });
  });

  it("will return all logs if type not passed", async () => {
    const logs: IEventLogEntry[] = [
      createLog("1", "event:received", 12345),
      createLog("2", "profile:loaded", 12346),
    ];
    (mapMock as jest.Mock).mockReturnValue({ ts: logs[0].timestamp });
    (mapMock as jest.Mock).mockReturnValue({ ts: logs[1].timestamp });
    (mockGetLogs as jest.Mock).mockResolvedValue(logs);

    const result = await getHistoryById(TENANT_ID, ID, undefined);

    expect(result.length).toBe(2);
    expect((mapMock as jest.Mock).mock.calls.length).toBe(2);
    expect((mapMock as jest.Mock).mock.calls[0][0]).toMatchObject({
      type: "event:received",
    });
    expect((mapMock as jest.Mock).mock.calls[1][0]).toMatchObject({
      type: "profile:loaded",
    });
  });
});
