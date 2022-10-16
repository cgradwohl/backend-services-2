import { KinesisStreamEvent } from "aws-lambda";
import { worker } from "~/automations/triggers/kinesis/segment-requests";
import { IRecord } from "~/segment/types";

const mockTrackingRequestGet = jest.fn();
const mockInboundRequestGet = jest.fn();

jest.mock("~/lib/get-environment-variable");
jest.mock("~/tracking-requests/stores/json", () => {
  return {
    trackingRequest: {
      get: (...args) => mockTrackingRequestGet(...args),
    },
    inboundSegmentEvents: {
      get: (...args) => mockInboundRequestGet(...args),
    },
  };
});
jest.mock("~/automations/lib/invoke-automation");

let mockIterTemplates = [];
jest.mock("~/automations/lib/services/templates", (...args) => () => {
  return { listBySource: (...args) => mockIterTemplates };
});

describe("segment-requests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should read from tracking segment store bucket", async () => {
    const event = getEvent(false);
    mockTrackingRequestGet.mockResolvedValue({
      automation: "some-automation",
      brand: "some-brand",
      data: { type: "track" },
      event: "some-event",
      profile: "some-profile",
      user: "some-user",
    });

    await worker(event);
    expect(mockTrackingRequestGet).toBeCalledTimes(1);
    expect(mockInboundRequestGet).toBeCalledTimes(0);
  });

  it("should read from tracking segment store bucket", async () => {
    const event = getEvent(true);
    mockInboundRequestGet.mockResolvedValue({
      automation: "some-automation",
      brand: "some-brand",
      data: { type: "track" },
      event: "some-event",
      profile: "some-profile",
      user: "some-user",
    });

    await worker(event);
    expect(mockTrackingRequestGet).toBeCalledTimes(0);
    expect(mockInboundRequestGet).toBeCalledTimes(1);
  });
});

const getEvent = (shouldUseInboundSegmentEventsKinesis: boolean) => {
  const data: IRecord = {
    scope: "published/production",
    tenantId: "some-tenant-id",
    trackingId: "some-tracking-id",
    dryRunKey: "default",
    shouldUseInboundSegmentEventsKinesis,
  };

  const kinesisEvent: KinesisStreamEvent = {
    Records: [
      {
        awsRegion: "us-east-1",
        eventID: "some-event-id",
        eventName: "some-event-name",
        eventSource: "some-event-source",
        eventSourceARN: "some-event-source-arn",
        eventVersion: "some-event-version",
        invokeIdentityArn: "some-invoke-identiy-arn",
        kinesis: {
          sequenceNumber: "0",
          approximateArrivalTimestamp: 160000000,
          kinesisSchemaVersion: "some-version",
          partitionKey: "some-key",
          data: Buffer.from(JSON.stringify(data)).toString("base64"),
        },
      },
    ],
  };

  return kinesisEvent;
};
