import uuid from "uuid";
import * as idempotentRequests from "~/lib/idempotent-requests";
import { DuplicateIdempotentRequestError } from "~/lib/idempotent-requests/types";
import { handle as handleSegment } from "~/segment/inbound";
import request from "~/tracking-requests/services/tracking-requests";
import { API_GATEWAY_PROXY_EVENT } from "../lib/lambda-response.spec";

const createMock = request("mockTenantid", "published/production")
  .create as jest.Mock;
jest.mock("~/tracking-requests/services/tracking-requests", () => {
  const createMock = jest.fn();
  return () => ({
    create: createMock,
  });
});

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

jest.mock("~/lib/x-ray/create-trace-id", () => () => "mockMessageId");

jest.mock("~/lib/idempotent-requests", () => ({
  get: jest.fn(),
  put: jest.fn(),
  update: jest.fn(),
}));

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/s3", () => {
  const putFn = jest.fn();
  const jsonStoreMockFn = <T>() => {
    return {
      put: putFn,
    };
  };
  return jsonStoreMockFn;
});

jest.mock("~/lib/enqueue", () => {
  const queueMock = jest.fn();
  return {
    enqueueByQueueUrl: () => queueMock,
  };
});

const idempotentGetMock = idempotentRequests.get as jest.Mock;
const idempotentPutMock = idempotentRequests.put as jest.Mock;
const idempotentUpdateMock = idempotentRequests.update as jest.Mock;

describe("segment handler", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("idempotency", () => {
    it("must return idempotency result if exists", async () => {
      const mockBody = JSON.stringify({ hello: "world" });
      idempotentPutMock.mockImplementationOnce(() => {
        throw new DuplicateIdempotentRequestError();
      });
      idempotentGetMock.mockImplementationOnce(() => {
        return {
          body: mockBody,
          statusCode: 202,
        };
      });

      const result = await handleSegment({
        ...API_GATEWAY_PROXY_EVENT,
        body: JSON.stringify(SEGMENT_EVENT),
      });

      expect(result.statusCode).toEqual(202);
      expect(result.body).toEqual(mockBody);
    });
  });

  describe("handler validator", () => {
    it("must return a 501 when missing required property: type", async () => {
      const event = Object.assign({}, SEGMENT_EVENT);

      const result = await handleSegment({
        ...API_GATEWAY_PROXY_EVENT,
        body: JSON.stringify(event),
      });

      expect(result.statusCode).toBe(501);
      expect(result.body).toEqual(
        JSON.stringify({
          message: "Event Type Unsupported: undefined",
        })
      );
    });

    describe("track validator", () => {
      const SEGMENT_TRACK_EVENT = {
        ...SEGMENT_EVENT,
        type: "track",
      };

      it("must return a 400 when missing required property: event", async () => {
        const event = Object.assign({}, SEGMENT_TRACK_EVENT);
        delete event.event;

        const result = await handleSegment({
          ...API_GATEWAY_PROXY_EVENT,
          body: JSON.stringify(event),
        });

        const expectedBody = JSON.stringify({
          message: `[{"error":" must have required property 'event'","path":""}]`,
        });

        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(expectedBody);

        expect(idempotentPutMock.mock.calls[0][2]).toEqual({
          body: undefined,
          statusCode: undefined,
        });

        expect(idempotentUpdateMock.mock.calls[0][2]).toEqual({
          body: expectedBody,
          statusCode: 400,
        });
      });

      it("must return a 400 when both list and pattern exist", async () => {
        const event = Object.assign({}, SEGMENT_TRACK_EVENT, {
          properties: {
            courier: {
              list: "mockList",
              pattern: "mockPattern",
            },
          },
        });

        const result = await handleSegment({
          ...API_GATEWAY_PROXY_EVENT,
          body: JSON.stringify(event),
        });

        const expectedBody = JSON.stringify({
          message: `Only one of the following courier properties allowed: 'list', 'pattern'`,
        });

        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(expectedBody);

        expect(idempotentPutMock.mock.calls[0][2]).toEqual({
          body: undefined,
          statusCode: undefined,
        });

        expect(idempotentUpdateMock.mock.calls[0][2]).toEqual({
          body: expectedBody,
          statusCode: 400,
        });
      });

      it("must return a 400 when missing required property group: anonymousId && userId", async () => {
        const event = Object.assign({}, SEGMENT_TRACK_EVENT);
        delete event.anonymousId;
        delete event.userId;

        const result = await handleSegment({
          ...API_GATEWAY_PROXY_EVENT,
          body: JSON.stringify(event),
        });

        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(
          JSON.stringify({
            message:
              '[{"error":" must have required property \'userId\'","path":""}]',
          })
        );
      });

      it("must write to kinesis with valid request", async () => {
        const result = await handleSegment({
          ...API_GATEWAY_PROXY_EVENT,
          body: JSON.stringify(SEGMENT_TRACK_EVENT),
        });

        expect(result.statusCode).toBe(202);

        expect(createMock.mock.calls[0][0]).toEqual("mockMessageId");
        const payloadSent = createMock.mock.calls[0][1];
        expect(payloadSent.data).toEqual(SEGMENT_TRACK_EVENT);
        expect(payloadSent.event).toEqual(SEGMENT_TRACK_EVENT.event);
        expect(payloadSent.user).toEqual(SEGMENT_TRACK_EVENT.userId);
      });
    });

    describe("identify validator", () => {
      const SEGMENT_IDENTIFY_EVENT = {
        ...SEGMENT_EVENT,
        type: "identify",
        traits: {
          immatrait: "immavalue",
        },
      };

      it("must return a 400 when missing required property: traits", async () => {
        const event = Object.assign({}, SEGMENT_IDENTIFY_EVENT);
        delete event.traits;

        const result = await handleSegment({
          ...API_GATEWAY_PROXY_EVENT,
          body: JSON.stringify(event),
        });

        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(
          JSON.stringify({
            message:
              '[{"error":" must have required property \'traits\'","path":""}]',
          })
        );
      });

      it("must return a 400 when missing required property group: anonymousId && userId", async () => {
        const event = Object.assign({}, SEGMENT_IDENTIFY_EVENT);
        delete event.anonymousId;
        delete event.userId;

        const result = await handleSegment({
          ...API_GATEWAY_PROXY_EVENT,
          body: JSON.stringify(event),
        });

        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(
          JSON.stringify({
            message:
              '[{"error":" must have required property \'userId\'","path":""}]',
          })
        );
      });
    });

    describe("group validator", () => {
      const SEGMENT_GROUP_EVENT = {
        ...SEGMENT_EVENT,
        type: "group",
        groupId: "test-group-4puebt",
        projectId: "eTI5H1Guxv",
        traits: {
          immatrait: "immavalue",
        },
      };

      it("must return a 400 when missing required property: groupId", async () => {
        const event = Object.assign({}, SEGMENT_GROUP_EVENT);
        delete event.groupId;

        const result = await handleSegment({
          ...API_GATEWAY_PROXY_EVENT,
          body: JSON.stringify(event),
        });

        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(
          JSON.stringify({
            message:
              '[{"error":" must have required property \'groupId\'","path":""}]',
          })
        );
      });

      it("must return a 400 when missing required property: traits", async () => {
        const event = Object.assign({}, SEGMENT_GROUP_EVENT);
        delete event.traits;

        const result = await handleSegment({
          ...API_GATEWAY_PROXY_EVENT,
          body: JSON.stringify(event),
        });

        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(
          JSON.stringify({
            message:
              '[{"error":" must have required property \'traits\'","path":""}]',
          })
        );
      });

      it("must return a 400 when missing required property group: anonymousId && userId", async () => {
        const event = Object.assign({}, SEGMENT_GROUP_EVENT);
        delete event.anonymousId;
        delete event.userId;

        const result = await handleSegment({
          ...API_GATEWAY_PROXY_EVENT,
          body: JSON.stringify(event),
        });

        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual(
          JSON.stringify({
            message:
              '[{"error":" must have required property \'userId\'","path":""}]',
          })
        );
      });
    });
  });
});
