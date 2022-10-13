import * as sendModule from "~/api/send";
import * as dynamoLib from "~/lib/dynamo/messages";
import * as createLogsModule from "~/lib/dynamo/event-logs";
import { ApiRequestContext } from "~/lib/lambda-response";

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/brands", () => ({
  getLatest: jest.fn().mockReturnValueOnce({
    id: "this-brand-exists",
    name: "this-brand-exists",
    published: 1231235,
  }),
}));

jest.mock("~/lib/dynamo/messages", () => ({
  create: jest.fn(),
}));

jest.mock("~/lib/dynamo/event-logs", () => ({
  createRequestReceivedEvent: jest.fn(),
  EntryTypes: {
    eventReceived: "event:received",
  },
}));

const createSpy = jest.spyOn(dynamoLib, "create");
const createLogsSpy = jest.spyOn(
  createLogsModule,
  "createRequestReceivedEvent"
);

jest.mock("~/lib/s3", () => {
  const jsonStoreMockFn = <T>() => {
    return {
      put: jest.fn(),
    };
  };
  return jsonStoreMockFn;
});

jest.mock("~/lib/enqueue", () => ({
  enqueueByQueueUrl: () => jest.fn(),
}));

describe(`send with valid payload`, () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should return 200 if payload is valid", async () => {
    await sendModule.handleSendRequest({
      context: {
        translateToV2: false,
        tenantId: "1234213",
        scope: "draft/",
        event: {
          body: {
            brand: "this-brand-exists",
            event: "PCD2NFHA624E10JGBZYYD7MJYGZ8",
            recipient: "argo",
            profile: '{"email":"argo@courier.com"}',
          },
        },
      } as unknown as ApiRequestContext,
      messageId: "1-616a628c-645660fe65ec70a74c9f1a7c",
    });

    expect(createLogsSpy).toHaveBeenCalledWith({
      tenantId: "1234213",
      requestId: "1-616a628c-645660fe65ec70a74c9f1a7c",
      request: {
        brand: "this-brand-exists",
        event: "PCD2NFHA624E10JGBZYYD7MJYGZ8",
        recipient: "argo",
        profile: { email: "argo@courier.com" },
      },
    });
    expect(createSpy).toHaveBeenCalledWith(
      "1234213",
      "PCD2NFHA624E10JGBZYYD7MJYGZ8",
      "argo",
      "1-616a628c-645660fe65ec70a74c9f1a7c",
      undefined,
      undefined,
      undefined,
      {
        idempotencyKey: undefined,
      }
    );
  });
});
