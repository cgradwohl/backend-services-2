import { retryMessage } from "~/send/utils/retry-message";
import * as dynamoLib from "~/lib/dynamo";
import {
  createRetryingEvent,
  createTimedoutEvent,
} from "~/lib/dynamo/event-logs";
import { isRouteLeafTimedOut } from "~/lib/send-routing";

jest.mock("~/lib/send-routing");
jest.mock("~/lib/send-routing/lib/get-route-node");
jest.mock("~/send/service/actions");

const putSpy = jest.spyOn(dynamoLib, "put");
const queueMock = jest.fn();
const mockIsRouteLeafTimedOut = isRouteLeafTimedOut as jest.Mock;

const getMockRetryMessage = (mockRetryCount: number) => ({
  messageId: "test-message-id",
  retryCount: mockRetryCount,
  streamName: "test-send-stream",
  tenantId: "test-tenant",
  type: "render",
});

const mockFailoverOpts = {
  address: [],
  tree: {},
  timeouts: {},
  times: {},
};

jest.mock("~/lib/dynamo", () => ({
  put: jest.fn().mockImplementation((params) => {
    const {
      Item: { ttl, pk, ...rest },
    } = params;
    expect(pk).toBeDefined();
    expect(ttl).toBeGreaterThan(0);
    expect(rest).toMatchSnapshot("should match DynamoDb payload");
  }),
}));

jest.mock("~/lib/dynamo/event-logs", () => ({
  createRetryingEvent: jest.fn(),
  createTimedoutEvent: jest.fn(),
}));

jest.mock("~/lib/enqueue", () => {
  return {
    enqueueByQueueUrl: () => queueMock,
  };
});

describe("retry-message", () => {
  beforeAll(() => {
    process.env.RETRY_SEND_QUEUE_URL = "retry-queue-url";
    process.env.RETRY_TABLE = "retry-table";
    process.env.DESTINATION_STREAM_FOR_RETRY = "test-send-stream";
  });

  beforeEach(jest.clearAllMocks);

  describe("retry failures in send kinesis stream workers", () => {
    it(`should retry using SQS VisibilityTimeout for first 10 retries`, async () => {
      expect.assertions(3);
      await retryMessage(getMockRetryMessage(1));
      expect(queueMock).toHaveBeenCalledTimes(1);
      expect(queueMock).toHaveBeenCalledWith(getMockRetryMessage(2));
      expect(createRetryingEvent).toHaveBeenCalledTimes(1);
    });

    it(`should retry using Dynamo TTL for last 15 retries`, async () => {
      expect.assertions(5); // The dynamo mock has assertions. This caused me much pain and confusion -_-
      await retryMessage(getMockRetryMessage(12));
      expect(putSpy).toHaveBeenCalledTimes(1);
      expect(createRetryingEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("unretryable", () => {
    it(`should not retry using Dynamo TTL for last 15 retries if timedout`, async () => {
      expect.assertions(4);
      mockIsRouteLeafTimedOut.mockReturnValue(true);
      await retryMessage(getMockRetryMessage(12), mockFailoverOpts as any);
      expect(putSpy).toHaveBeenCalledTimes(0);
      expect(createRetryingEvent).toHaveBeenCalledTimes(0);
      expect(createTimedoutEvent).toHaveBeenCalledTimes(1);
      expect(mockIsRouteLeafTimedOut).toHaveBeenCalledTimes(1);
    });

    it(`should not retry using Dynamo TTL for after 25 retries`, async () => {
      expect.assertions(1);
      await retryMessage(getMockRetryMessage(25));
      expect(createTimedoutEvent).toHaveBeenCalledTimes(1);
    });
  });
});
