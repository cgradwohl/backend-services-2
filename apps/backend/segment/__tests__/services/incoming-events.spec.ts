import subHours from "date-fns/subHours";
import subMinutes from "date-fns/subMinutes";
import { getItem } from "~/lib/dynamo";
import { currentTimeMs } from "~/lib/utils/date";
import incomingSegmentEventsFactory from "../../services/incoming-events";
import { InboundSegmentRequestTypesEnum } from "../../types";

jest.mock("~/lib/dynamo");
jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/s3");
jest.mock("~/lib/utils/date");

const mockCurrentTimeMs = currentTimeMs as jest.Mock;
const mockGetItem = getItem as jest.Mock;
const incomingSegmentEvents = incomingSegmentEventsFactory("TENANT_ID");

afterEach(() => {
  jest.clearAllMocks();
});

describe("shouldKeepHistory", () => {
  it("should attempt to fetch the event from dynamo", async () => {
    const shouldKeepHistory = await incomingSegmentEvents.shouldKeepHistory({
      event: "fake-track-event",
      messageId: "1-message-id",
      properties: {},
      type: InboundSegmentRequestTypesEnum.TRACK,
      userId: "fake-user-id",
    });

    expect(mockGetItem).toBeCalledWith({
      Key: {
        pk: "TENANT_ID/track/fake-track-event",
      },
      TableName: "SEGMENT_EVENTS_TABLE",
    });
  });

  it("should return true when the event is not found", async () => {
    const shouldKeepHistory = await incomingSegmentEvents.shouldKeepHistory({
      event: "fake-track-event",
      messageId: "1-message-id",
      properties: {},
      type: InboundSegmentRequestTypesEnum.TRACK,
      userId: "fake-user-id",
    });

    expect(shouldKeepHistory).toBe(true);
  });

  it("should return true when the event timestamp is not found", async () => {
    mockGetItem.mockResolvedValueOnce({
      Item: {
        pk: "pk",
        gsi1pk: "gsi1pk",
        gsi1sk: "gsi1sk",
      },
    });

    const shouldKeepHistory = await incomingSegmentEvents.shouldKeepHistory({
      event: "fake-track-event",
      messageId: "1-message-id",
      properties: {},
      type: InboundSegmentRequestTypesEnum.TRACK,
      userId: "fake-user-id",
    });

    expect(shouldKeepHistory).toBe(true);
  });

  it("should return false when the time exactly the same as threshold", async () => {
    const now = new Date();
    mockCurrentTimeMs.mockReturnValue(now);

    mockGetItem.mockResolvedValueOnce({
      Item: {
        pk: "pk",
        gsi1pk: "gsi1pk",
        gsi1sk: "gsi1sk",
        lastUpdated: now.toISOString(),
      },
    });

    const shouldKeepHistory = await incomingSegmentEvents.shouldKeepHistory({
      event: "fake-track-event",
      messageId: "1-message-id",
      properties: {},
      type: InboundSegmentRequestTypesEnum.TRACK,
      userId: "fake-user-id",
    });

    expect(shouldKeepHistory).toBe(false);
  });

  it("should return false when the approaching threshold but not met", async () => {
    const twelveHours = 12 * 60;
    const now = new Date();
    mockCurrentTimeMs.mockReturnValue(now);

    mockGetItem.mockResolvedValueOnce({
      Item: {
        pk: "pk",
        gsi1pk: "gsi1pk",
        gsi1sk: "gsi1sk",
        lastUpdated: subHours(now, 12).toISOString(),
      },
    });

    const shouldKeepHistory = await incomingSegmentEvents.shouldKeepHistory({
      event: "fake-track-event",
      messageId: "1-message-id",
      properties: {},
      type: InboundSegmentRequestTypesEnum.TRACK,
      userId: "fake-user-id",
    });

    expect(shouldKeepHistory).toBe(false);
  });

  it("should return false when exactly at the threshold", async () => {
    const now = new Date();
    mockCurrentTimeMs.mockReturnValue(now);

    mockGetItem.mockResolvedValueOnce({
      Item: {
        pk: "pk",
        gsi1pk: "gsi1pk",
        gsi1sk: "gsi1sk",
        lastUpdated: subHours(now, 24).toISOString(),
      },
    });

    const shouldKeepHistory = await incomingSegmentEvents.shouldKeepHistory({
      event: "fake-track-event",
      messageId: "1-message-id",
      properties: {},
      type: InboundSegmentRequestTypesEnum.TRACK,
      userId: "fake-user-id",
    });

    expect(shouldKeepHistory).toBe(false);
  });

  it("should return true when one minute over the threshold", async () => {
    const twentyFourHoursOneMinute = 24 * 60 + 1;
    const now = new Date();
    mockCurrentTimeMs.mockReturnValue(now);

    mockGetItem.mockResolvedValueOnce({
      Item: {
        pk: "pk",
        gsi1pk: "gsi1pk",
        gsi1sk: "gsi1sk",
        lastUpdated: subMinutes(now, twentyFourHoursOneMinute).toISOString(),
      },
    });

    const shouldKeepHistory = await incomingSegmentEvents.shouldKeepHistory({
      event: "fake-track-event",
      messageId: "1-message-id",
      properties: {},
      type: InboundSegmentRequestTypesEnum.TRACK,
      userId: "fake-user-id",
    });

    expect(shouldKeepHistory).toBe(true);
  });

  it("should return true when far over the threshold", async () => {
    const now = new Date();
    mockCurrentTimeMs.mockReturnValue(now);

    mockGetItem.mockResolvedValueOnce({
      Item: {
        pk: "pk",
        gsi1pk: "gsi1pk",
        gsi1sk: "gsi1sk",
        lastUpdated: subHours(now, 48).toISOString(),
      },
    });

    const shouldKeepHistory = await incomingSegmentEvents.shouldKeepHistory({
      event: "fake-track-event",
      messageId: "1-message-id",
      properties: {},
      type: InboundSegmentRequestTypesEnum.TRACK,
      userId: "fake-user-id",
    });

    expect(shouldKeepHistory).toBe(true);
  });
});
