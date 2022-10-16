import uuid from "uuid/v4";
import { nanoid } from "nanoid";
import requests from "~/tracking-requests/services/tracking-requests";
import { NewTrackingRequest } from "~/tracking-requests/types";
import { TenantRouting, TenantScope } from "~/types.internal";

const mockTrackingRequestPut = jest.fn();
const mockInboundRequestPut = jest.fn();

jest.mock("~/lib/get-environment-variable");
jest.mock("~/tracking-requests/stores/json", () => {
  return {
    trackingRequest: {
      put: (...args) => mockTrackingRequestPut(...args),
    },
    inboundSegmentEvents: {
      put: (...args) => mockInboundRequestPut(...args),
    },
  };
});

const mockKinesisPutRecord = jest.fn();
jest.mock("~/lib/kinesis", () => {
  return {
    putRecord: async (...args) => mockKinesisPutRecord(...args),
  };
});

describe("tracking-requests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should make the request to the tracking request bucket", async () => {
    const { tenantId, scope, dryRunKey } = createRequestPayload();
    const trackingId = uuid();
    const requestObj = createRequest();

    await requests(tenantId, scope, dryRunKey).create(
      trackingId,
      requestObj,
      undefined
    );

    expect(mockTrackingRequestPut).toHaveBeenCalledTimes(1);
    expect(mockInboundRequestPut).not.toHaveBeenCalled();
  });

  it("should make the request to the tracking request bucket", async () => {
    const { tenantId, scope, dryRunKey } = createRequestPayload();
    const trackingId = uuid();
    const requestObj = createRequest();

    await requests(tenantId, scope, dryRunKey).create(
      trackingId,
      requestObj,
      false
    );

    expect(mockTrackingRequestPut).toHaveBeenCalledTimes(1);
    expect(mockInboundRequestPut).not.toHaveBeenCalled();
  });

  it("should make the request to the incoming segment events bucket", async () => {
    const { tenantId, scope, dryRunKey } = createRequestPayload();
    const trackingId = uuid();
    const requestObj = createRequest();

    await requests(tenantId, scope, dryRunKey).create(
      trackingId,
      requestObj,
      true
    );

    expect(mockInboundRequestPut).toHaveBeenCalledTimes(1);
    expect(mockTrackingRequestPut).not.toHaveBeenCalled();
    expect(mockKinesisPutRecord).toHaveBeenCalledTimes(1);
  });
});

const createRequestPayload = (): {
  tenantId: string;
  scope: TenantScope;
  dryRunKey?: TenantRouting;
} => {
  return {
    tenantId: uuid(),
    scope: "published/production",
    dryRunKey: "default",
  };
};

const createRequest = (): NewTrackingRequest => {
  return {
    event: "SOME_MAPPED_EVENT",
    user: "some-user",
    data: {
      channel: "server",
      email: "test@example.org",
      messageId: nanoid(21),
      projectId: nanoid(22),
      replay: true,
      timestamp: "2022-10-06T23:10:20.170Z",
      traits: { trait1: 1, trait2: "test", trait3: true },
      type: "track",
      userId: "test-user-ijbxkj",
      event: "SEGMENT_2",
    },
  };
};
