import uuid from "uuid";
import {
  get as getIdempotentRequest,
  put as putIdempotentRequest,
  update as updateIdempotentRequest,
} from "~/lib/idempotent-requests";
import { InvalidListSearchPatternError } from "~/lib/lists/errors";
import { handle as handleSegment } from "~/segment/inbound";
import { API_GATEWAY_PROXY_EVENT } from "../lib/lambda-response.spec";

const SEGMENT_EVENT = {
  anonymousId: uuid.v4(),
  event: "imma test event",
  messageId: uuid.v4(),
  properties: {
    immaproperty: "immavalue",
  },
  receivedAt: Date.now().toString(),
  timestamp: Date.now().toString(),

  userId: uuid.v4(),
};

API_GATEWAY_PROXY_EVENT.requestContext = {
  authorizer: {
    tenantId: "mockTenantId",
  },
};

jest.mock("~/lib/lists", () => {
  return {
    get: jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "mockListId",
      }), // This is to test the error case where the list is not found
    assertValidPattern: jest.fn().mockImplementation(() => {
      throw new InvalidListSearchPatternError(
        "Pattern cannot match all lists. At least one pattern part must not match: *"
      );
    }),
  };
});

jest.mock("~/lib/amzn-trace-id", () => () => ({
  root: "mockMessageId",
}));

jest.mock("~/lib/idempotent-requests", () => ({
  get: jest.fn(),
  put: jest.fn(),
  update: jest.fn(),
}));

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

const createMock = jest.fn();

jest.mock("~/tracking-requests/services/tracking-requests", () => {
  return () => ({
    create: createMock,
  });
});

describe("list pattern validation validation", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should validate if list exists before further processing", async () => {
    const SEGMENT_TRACK_EVENT_WITH_LIST = {
      ...SEGMENT_EVENT,
      properties: {
        ...SEGMENT_EVENT.properties,
        courier: {
          list: "mockList",
        },
      },
      type: "track",
    };

    const result = await handleSegment({
      ...API_GATEWAY_PROXY_EVENT,
      body: JSON.stringify(SEGMENT_TRACK_EVENT_WITH_LIST),
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toEqual(
      '{"message":"Cannot send to archived list (mockList)"}'
    );
  });
  it("should validate invalid list pattern exists before further processing", async () => {
    const SEGMENT_TRACK_EVENT_WITH_PATTERN = {
      ...SEGMENT_EVENT,
      properties: {
        ...SEGMENT_EVENT.properties,
        courier: {
          pattern: "*",
        },
      },
      type: "track",
    };

    const response = await handleSegment({
      ...API_GATEWAY_PROXY_EVENT,
      body: JSON.stringify(SEGMENT_TRACK_EVENT_WITH_PATTERN),
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual(
      '{"message":"Pattern cannot match all lists. At least one pattern part must not match: *"}'
    );
  });

  it("should validate invalid list pattern exists before further processing", async () => {
    const SEGMENT_TRACK_EVENT_WITH_NON_EXISTING_LIST = {
      ...SEGMENT_EVENT,
      properties: {
        ...SEGMENT_EVENT.properties,
        courier: {
          // This list does not exist
          list: "wallets-123",
        },
      },
      type: "track",
    };

    const response = await handleSegment({
      ...API_GATEWAY_PROXY_EVENT,
      body: JSON.stringify(SEGMENT_TRACK_EVENT_WITH_NON_EXISTING_LIST),
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual('{"message":"List wallets-123 not found"}');
  });

  it("should continue processing if list is valid", async () => {
    const SEGMENT_TRACK_EVENT_WITH_LIST = {
      ...SEGMENT_EVENT,
      properties: {
        ...SEGMENT_EVENT.properties,
        courier: {
          list: "mockList",
        },
      },
      type: "track",
    };

    const result = await handleSegment({
      ...API_GATEWAY_PROXY_EVENT,
      body: JSON.stringify(SEGMENT_TRACK_EVENT_WITH_LIST),
    });
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(putIdempotentRequest).toHaveBeenCalledTimes(1);
    expect(updateIdempotentRequest).toHaveBeenCalledTimes(1);
    expect(result.statusCode).toBe(202);
  });

  it("should not apply idempotency if event is from segment event tester", async () => {
    const SEGMENT_EVENT_TESTER_EVENT = {
      ...SEGMENT_EVENT,
      messageId: "segment-test-message-asdjnadj",
      type: "track",
    };

    const result = await handleSegment({
      ...API_GATEWAY_PROXY_EVENT,
      body: JSON.stringify(SEGMENT_EVENT_TESTER_EVENT),
    });
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(putIdempotentRequest).toHaveBeenCalledTimes(0);
    expect(getIdempotentRequest).toHaveBeenCalledTimes(0);
    expect(updateIdempotentRequest).toHaveBeenCalledTimes(0);
    expect(result.statusCode).toBe(202);
  });
});
