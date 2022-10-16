import { KinesisStreamRecord } from "aws-lambda";
import { handleRecord } from "../persist-records";

const mockGetRequest = jest.fn();
const mockPutEvent = jest.fn();
const mockShouldKeepHistory = jest.fn();

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");
jest.mock("~/tracking-requests/services/tracking-requests", () => {
  return jest.fn().mockReturnValue({
    get: (...args) => mockGetRequest(...args),
  });
});
jest.mock("../services/incoming-events", () => {
  return jest.fn().mockReturnValue({
    shouldKeepHistory: (...args) => mockShouldKeepHistory(...args),
    put: (...args) => mockPutEvent(...args),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

const createKinesisPayload = <T>(data: T) => {
  return {
    kinesis: {
      data: Buffer.from(JSON.stringify(data)).toString("base64"),
    },
  } as KinesisStreamRecord;
};

describe("shouldKeepHistory", () => {
  it("should attempt to write history event when true", async () => {
    const dataBlob = {
      data: { extra: "data" },
    };
    mockGetRequest.mockResolvedValue(dataBlob);
    mockShouldKeepHistory.mockResolvedValue(true);

    const event = createKinesisPayload({
      dryRunKey: "default",
      scope: "published/production",
      tenantId: "mock-tenant-id",
      messageId: "1-mock-message-id",
    });

    await handleRecord(event);

    expect(mockPutEvent).toBeCalledWith(dataBlob.data);
  });

  it("should not attempt to write history event when false", async () => {
    mockGetRequest.mockResolvedValue({});
    mockShouldKeepHistory.mockResolvedValue(false);

    const event = createKinesisPayload({
      dryRunKey: "default",
      scope: "published/production",
      tenantId: "mock-tenant-id",
      messageId: "1-mock-message-id",
    });
    await handleRecord(event);

    expect(mockPutEvent).not.toBeCalled();
  });

  it("should attempt to write history event when true and using new incoming kinesis event stream", async () => {
    const dataBlob = {
      data: { extra: "data", from: "new-kinesis" },
    };
    mockGetRequest.mockResolvedValue(dataBlob);
    mockShouldKeepHistory.mockResolvedValue(true);

    const event = createKinesisPayload({
      dryRunKey: "default",
      scope: "published/production",
      tenantId: "mock-tenant-id",
      messageId: "1-mock-message-id",
      shouldUseInboundSegmentEventsKinesis: true,
    });
    await handleRecord(event);

    expect(mockPutEvent).toBeCalledWith(dataBlob.data);
  });

  it("should not attempt to write history event when false", async () => {
    mockGetRequest.mockResolvedValue({});
    mockShouldKeepHistory.mockResolvedValue(false);

    const event = createKinesisPayload({
      dryRunKey: "default",
      scope: "published/production",
      tenantId: "mock-tenant-id",
      messageId: "1-mock-message-id",
      shouldUseInboundSegmentEventsKinesis: false,
    });
    await handleRecord(event);

    expect(mockPutEvent).not.toBeCalled();
  });
});
