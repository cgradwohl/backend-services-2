import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import getUnixTime from "date-fns/getUnixTime";
import subHours from "date-fns/subHours";

import enqueueMessage from "~/lib/enqueue";
import * as mockTtlCheckDeliveryStream from "~/__tests__/triggers/dynamodb/fixtures/v2/check-delivery-stream.json";
import * as mockTtlEventStream from "~/__tests__/triggers/dynamodb/fixtures/v2/delivery-event-stream.json";
import * as mockTtlPrepareMessageStream from "~/__tests__/triggers/dynamodb/fixtures/v2/prepare-message-stream.json";
import * as mockTtlRouteMessageStream from "~/__tests__/triggers/dynamodb/fixtures/v2/route-message-stream.json";
import { handle } from "~/triggers/dynamodb/retry-message-v2";

// required to stub out sentry integration
jest.mock("~/lib/capture-exception", () => jest.fn());

jest.mock("~/lib/enqueue", () => {
  const enqueue = jest.fn();
  return jest.fn(() => enqueue);
});

describe("[Retry Messages V2] should retry SQS message | check-delivery-status | events", () => {
  let enqueue: jest.Mock;

  beforeAll(() => {
    process.env.SQS_ROUTE_QUEUE_NAME = "test-sqs-route-queue";
    process.env.SQS_PREPARE_QUEUE_NAME = "test-sqs-prepare-queue";
    process.env.SQS_CHECK_DELIVERY_STATUS_QUEUE_NAME =
      "test-sqs-check-delivery-status-queue";
  });

  beforeEach(() => {
    enqueue = (enqueueMessage as jest.Mock)();
  });

  it("should retry expired (ttl < current-time) check-delivery message when removed from dynamodb", async () => {
    const streamEventWithExpiredTtl: DynamoDBStreamEvent = {
      Records: [mockTtlCheckDeliveryStream as unknown as DynamoDBRecord],
    };
    await handle(streamEventWithExpiredTtl);
    expect(enqueue.mock.calls[0]).toMatchSnapshot();
  });

  it("should retry expired (ttl < current-time) delivery event removed from dynamodb", async () => {
    const streamEventWithExpiredTtl: DynamoDBStreamEvent = {
      Records: [mockTtlEventStream as unknown as DynamoDBRecord],
    };
    await handle(streamEventWithExpiredTtl);
    expect(enqueue.mock.calls[0]).toMatchSnapshot();
  });

  it("should retry prepare event", async () => {
    const mockPrepareEvent = { ...mockTtlPrepareMessageStream };
    mockPrepareEvent.dynamodb.OldImage.ttl.N = getUnixTime(
      new Date()
    ).toString();

    const streamEventWithExpiredTtl: DynamoDBStreamEvent = {
      Records: [mockPrepareEvent as unknown as DynamoDBRecord],
    };
    await handle(streamEventWithExpiredTtl);
    expect(enqueue.mock.calls[0]).toMatchSnapshot();
  });

  it("should retry route event", async () => {
    const mockRouteEvent = { ...mockTtlRouteMessageStream };
    mockRouteEvent.dynamodb.OldImage.ttl.N = getUnixTime(new Date()).toString();

    const streamEventWithExpiredTtl: DynamoDBStreamEvent = {
      Records: [mockRouteEvent as unknown as DynamoDBRecord],
    };
    await handle(streamEventWithExpiredTtl);
    expect(enqueue.mock.calls[0]).toMatchSnapshot();
  });

  it("should not retry prepare event removed from dynamodb older than 48 hours", async () => {
    const mockExpiredPrepareEvent = { ...mockTtlPrepareMessageStream };
    mockExpiredPrepareEvent.dynamodb.OldImage.ttl.N = getUnixTime(
      subHours(new Date(), 49)
    ).toString();

    const streamEventWithExpiredTtl: DynamoDBStreamEvent = {
      Records: [mockExpiredPrepareEvent as unknown as DynamoDBRecord],
    };
    await handle(streamEventWithExpiredTtl);
    expect(enqueue).not.toBeCalled();
  });

  it("should not retry route event removed from dynamodb older than 48 hours", async () => {
    const mockExpiredRouteEvent = { ...mockTtlRouteMessageStream };
    mockExpiredRouteEvent.dynamodb.OldImage.ttl.N = getUnixTime(
      subHours(new Date(), 49)
    ).toString();

    const streamEventWithExpiredTtl: DynamoDBStreamEvent = {
      Records: [mockExpiredRouteEvent as unknown as DynamoDBRecord],
    };
    await handle(streamEventWithExpiredTtl);
    expect(enqueue).not.toBeCalled();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = undefined;
  });
});
