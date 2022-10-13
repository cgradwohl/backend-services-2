import { APIGatewayProxyEvent } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import axios from "axios";

import {
  getTrackingId,
  handle as slackWebhookHandler,
} from "~/client-routes/webhooks/slack";
import { getItem } from "~/lib/dynamo";
import {
  createClickedEvent,
  createWebhookResponseEvent,
} from "~/lib/dynamo/event-logs";
import generateSlackSignature from "~/lib/slack/generate-slack-signature";
import generateSlackWebhookBody from "~/lib/slack/generate-slack-webhook-body";
import parseSlackWebhookBody from "~/lib/slack/parse-slack-webhook-body";

const axiosSpy = axios as any as jest.Mock;
const dynamoGetItemSpy = getItem as jest.Mock;
const createClickedEventSpy = createClickedEvent as jest.Mock;
const createWebhookResponseEventSpy = createWebhookResponseEvent as jest.Mock;

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/log", () => ({
  __esModule: true,
  default: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

jest.mock("~/lib/dynamo", () => {
  return {
    __esModule: true,
    getItem: jest.fn(),
  };
});

jest.mock("axios", () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock("~/lib/dynamo/event-logs", () => {
  return {
    createClickedEvent: jest.fn(),
    createWebhookResponseEvent: jest.fn(),
  };
});

jest.mock("~/lib/get-environment-variable");

const mockBody = generateSlackWebhookBody({
  actions: [{ action_id: "my-tracking-id" }],
});
const mockSlackSigningSecret = "my-slack-signing-secret";
const mockTimestamp = "123456789";

const mockWebhookData = {
  body: mockBody,
  configurationId: "my-configuration-id",
  domainName: "my-tenant-id.ct0.app",
  signature: generateSlackSignature(
    mockSlackSigningSecret,
    mockTimestamp,
    mockBody
  ),
  timestamp: mockTimestamp,
};

const mockConfigurationData = {
  signingSecret: mockSlackSigningSecret,
  webhookUrl: "https://example.com/webhook-url",
};
const mockConfiguration = {
  id: "my-configuration-id",
  json: JSON.stringify(mockConfigurationData),
  objtype: "configuration",
};

const mockCttRecord = {
  channel: {
    id: "",
    taxonomy: "direct_message:*",
  },
  data: { actionId: "my-desired-action-id" },
  messageId: "my-message-id",
  providerKey: "slack",
};

const getMockSlackEvent = ({
  body,
  configurationId,
  domainName,
  signature,
  timestamp,
}: {
  body?: any;
  configurationId?: string;
  domainName?: string;
  signature?: string;
  timestamp?: string;
}): APIGatewayProxyEvent => ({
  body,
  headers: {
    Accept: "application/json,*/*",
    "Accept-Encoding": "gzip,deflate",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
    "X-Forwarded-For": "127.0.0.1, 192.168.0.1",
    "X-Slack-Request-Timestamp": timestamp,
    "X-Slack-Signature": signature,
  },
  httpMethod: "POST",
  isBase64Encoded: false,
  multiValueHeaders: {},
  multiValueQueryStringParameters: {},
  path: "",
  pathParameters: {
    configurationId,
  },
  queryStringParameters: {},
  requestContext: {
    domainName,
    identity: {
      sourceIp: "127.0.0.1",
      userAgent: "mock-user-agent",
    },
  } as APIGatewayProxyEvent["requestContext"],
  resource: "",
  stageVariables: {},
});

const expectError = (value: any, errorMessage: string, statusCode: number) => {
  expect(value).toEqual({
    body: JSON.stringify({
      message: errorMessage,
      type: "invalid_request_error",
    }),
    headers: {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "*",
      "Strict-Transport-Security": "max-age=31536000;includeSubDomains;preload",
      "X-Content-Type-Options": "nosniff",
    },
    isBase64Encoded: undefined,
    multiValueHeaders: undefined,
    statusCode,
  });
};

describe("getTrackingId", () => {
  it("should get the trackingId from the actions", () => {
    expect(
      getTrackingId({ actions: [{ action_id: "my-tracking-id" }] })
    ).toEqual("my-tracking-id");
  });

  it("should return undefined if no tracking id", () => {
    expect(getTrackingId("bad")).toEqual(undefined);
    expect(getTrackingId({})).toEqual(undefined);
    expect(getTrackingId({ actions: "bad" })).toEqual(undefined);
    expect(getTrackingId({ actions: [] })).toEqual(undefined);
    expect(getTrackingId({ actions: [{}] })).toEqual(undefined);
  });
});

describe("parseSlackWebhookBody", () => {
  it("should parse a Slack webhook body", () => {
    const testData = { test: true };
    // slack webhook bodys come in as url encoded json value... because json alone is not enough?
    const testBody = `payload=${encodeURIComponent(JSON.stringify(testData))}`;

    expect(parseSlackWebhookBody(testBody)).toEqual(testData);
  });

  it("should throw if unable to parse", () => {
    const testData = { test: true };

    let testBody = `payload=${JSON.stringify(testData)}`;
    expect(parseSlackWebhookBody(testBody)).toEqual(testData);

    testBody = `bad=${encodeURIComponent(JSON.stringify(testData))}`;
    expect(() => parseSlackWebhookBody(testBody)).toThrow(
      /^Body could not be parsed/
    );

    testBody = `payload=${encodeURIComponent("invalid json value")}`;
    expect(() => parseSlackWebhookBody(testBody)).toThrow(
      /^Body could not be parsed/
    );
  });
});

describe("Slack webhook handler", () => {
  const origProcessEnv = process.env;
  const origConsole = global.console;

  beforeEach(() => {
    process.env = {
      ...process.env,
      CLICK_THROUGH_TRACKING_DOMAIN_NAME: "ct0.app",
      OBJECTS_TABLE_NAME: "objects-table",
    };
    global.console = { ...origConsole, error: jest.fn(), warn: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = origProcessEnv;
    global.console = origConsole;
  });

  it("should check required fields", async () => {
    expectError(
      await slackWebhookHandler(
        getMockSlackEvent({ ...mockWebhookData, timestamp: undefined })
      ),
      "Missing timestamp",
      400
    );

    expectError(
      await slackWebhookHandler(
        getMockSlackEvent({ ...mockWebhookData, signature: undefined })
      ),
      "Missing signature",
      400
    );

    expectError(
      await slackWebhookHandler(
        getMockSlackEvent({ ...mockWebhookData, domainName: undefined })
      ),
      "Missing tenantId",
      400
    );

    expectError(
      await slackWebhookHandler(
        getMockSlackEvent({ ...mockWebhookData, configurationId: undefined })
      ),
      "Missing configurationId",
      400
    );
  });

  it("should record the webhook call and pass the webhook response on", async () => {
    dynamoGetItemSpy.mockImplementation(
      async ({
        Key,
        TableName: table,
      }: DocumentClient.GetItemInput): Promise<DocumentClient.GetItemOutput> => {
        const { id, trackingId, pk } = Key;

        if (table === "objects-table" && id === "my-configuration-id") {
          return { Item: mockConfiguration };
        }

        if (
          table === "EVENT_TRACKING_RECORDS_TABLE" &&
          pk === "my-tenant-id/my-tracking-id"
        ) {
          return { Item: undefined };
        }

        if (
          table === "CLICK_THROUGH_TRACKING_TABLE_NAME" &&
          trackingId === "my-tracking-id"
        ) {
          return { Item: mockCttRecord };
        }

        throw new Error("Unhandled mock");
      }
    );

    const mockWebhookResponse = {
      data: { myBodyValue: true },
      headers: {
        "X-My-Test-Header": "should be passed on",
      },
      status: 200,
    };

    axiosSpy.mockImplementation(async () => mockWebhookResponse);

    expect(
      await slackWebhookHandler(getMockSlackEvent(mockWebhookData))
    ).toEqual({
      body: JSON.stringify(mockWebhookResponse.data),
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Strict-Transport-Security":
          "max-age=31536000;includeSubDomains;preload",
        "X-Content-Type-Options": "nosniff",
        "X-My-Test-Header": "should be passed on",
      },
      isBase64Encoded: undefined,
      multiValueHeaders: undefined,
      statusCode: mockWebhookResponse.status,
    });

    expect(createClickedEventSpy.mock.calls.length).toBe(1);
    expect(createClickedEventSpy.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "my-tenant-id",
        "my-message-id",
        "slack",
        Object {
          "id": "",
          "taxonomy": "direct_message:*",
        },
        Object {
          "channel": Object {
            "id": "",
            "taxonomy": "direct_message:*",
          },
          "clickHeaders": Object {
            "Accept": "application/json,*/*",
            "Accept-Encoding": "gzip,deflate",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
            "X-Forwarded-For": "127.0.0.1, 192.168.0.1",
            "X-Slack-Request-Timestamp": "123456789",
            "X-Slack-Signature": "v0=e370d34ba455aad7cf3f55694d2d24c9ea54a561672e7cde52035cecd9aa604a",
          },
          "clickIp": "127.0.0.1",
          "clickUserAgent": "mock-user-agent",
          "data": Object {
            "actionId": "my-desired-action-id",
          },
          "forwardingUrl": "https://example.com/webhook-url",
          "messageId": "my-message-id",
          "providerKey": "slack",
          "slackPayload": Object {
            "actions": Array [
              Object {
                "action_id": "my-tracking-id",
              },
            ],
          },
        },
      ]
    `);

    expect(axiosSpy.mock.calls.length).toBe(1);
    expect(axiosSpy.mock.calls[0][0]).toBe("https://example.com/webhook-url");
    expect(axiosSpy.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "data": "payload=%7B%22actions%22%3A%5B%7B%22action_id%22%3A%22my-desired-action-id%22%7D%5D%7D",
        "headers": Object {
          "Accept": "application/json,*/*",
          "Accept-Encoding": "gzip,deflate",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
          "X-Forwarded-For": "127.0.0.1, 192.168.0.1",
          "X-Slack-Request-Timestamp": "123456789",
          "X-Slack-Signature": "v0=d750ed2ac8b030f60e865e718558d6cd1d0aeae3bdbc76ef4bd72507f917fe24",
        },
        "method": "post",
        "responseType": "text",
        "validateStatus": [Function],
      }
    `);

    expect(createWebhookResponseEventSpy.mock.calls.length).toBe(1);
    expect(createWebhookResponseEventSpy.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "my-tenant-id",
        "my-message-id",
        Object {
          "body": Object {
            "myBodyValue": true,
          },
          "channel": Object {
            "id": "",
            "taxonomy": "direct_message:*",
          },
          "data": Object {
            "actionId": "my-desired-action-id",
          },
          "headers": Object {
            "X-My-Test-Header": "should be passed on",
          },
          "messageId": "my-message-id",
          "providerKey": "slack",
          "status": 200,
        },
      ]
    `);
  });

  it("should pass through webhook calls that aren't from us", async () => {
    dynamoGetItemSpy.mockImplementation(
      async ({
        Key,
        TableName: table,
      }: DocumentClient.GetItemInput): Promise<DocumentClient.GetItemOutput> => {
        const { id, trackingId, pk } = Key;

        if (table === "objects-table" && id === "my-configuration-id") {
          return { Item: mockConfiguration };
        }

        if (
          table === "EVENT_TRACKING_RECORDS_TABLE" &&
          pk === "my-tenant-id/unknown"
        ) {
          return { Item: undefined };
        }

        if (
          table === "CLICK_THROUGH_TRACKING_TABLE_NAME" &&
          trackingId === "unknown"
        ) {
          return { Item: undefined };
        }

        throw new Error("Unhandled mock");
      }
    );

    const mockWebhookResponse = {
      data: { myBodyValue: true },
      headers: {
        "X-My-Test-Header": "should be passed on",
      },
      status: 200,
    };

    axiosSpy.mockImplementation(async () => mockWebhookResponse);

    const bodyWithUnrecognizedActionId = generateSlackWebhookBody({
      actions: [{ action_id: "unknown" }],
    });

    expect(
      await slackWebhookHandler(
        getMockSlackEvent({
          ...mockWebhookData,
          body: bodyWithUnrecognizedActionId,
          signature: generateSlackSignature(
            mockSlackSigningSecret,
            mockTimestamp,
            bodyWithUnrecognizedActionId
          ),
        })
      )
    ).toEqual({
      body: JSON.stringify(mockWebhookResponse.data),
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Strict-Transport-Security":
          "max-age=31536000;includeSubDomains;preload",
        "X-Content-Type-Options": "nosniff",
        "X-My-Test-Header": "should be passed on",
      },
      isBase64Encoded: undefined,
      multiValueHeaders: undefined,
      statusCode: mockWebhookResponse.status,
    });

    expect(createClickedEventSpy.mock.calls).toEqual([]);
    expect(axiosSpy.mock.calls.length).toBe(1);
    expect(axiosSpy.mock.calls[0][0]).toBe("https://example.com/webhook-url");
    expect(axiosSpy.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "data": "payload=%7B%22actions%22%3A%5B%7B%22action_id%22%3A%22unknown%22%7D%5D%7D",
        "headers": Object {
          "Accept": "application/json,*/*",
          "Accept-Encoding": "gzip,deflate",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
          "X-Forwarded-For": "127.0.0.1, 192.168.0.1",
          "X-Slack-Request-Timestamp": "123456789",
          "X-Slack-Signature": "v0=e0a93db9062e23c2b7bbb09b2a74e8184d191ea8241c5e1243e23401c544c08e",
        },
        "method": "post",
        "responseType": "text",
        "validateStatus": [Function],
      }
    `);

    expect(createWebhookResponseEventSpy.mock.calls).toEqual([]);
  });

  it("should throw without a signing secret", async () => {
    dynamoGetItemSpy.mockImplementation(
      async ({
        Key,
        TableName: table,
      }: DocumentClient.GetItemInput): Promise<DocumentClient.GetItemOutput> => {
        const { id, trackingId, pk } = Key;

        if (table === "objects-table" && id === "my-configuration-id") {
          return {
            Item: {
              ...mockConfiguration,
              json: JSON.stringify({
                ...mockConfigurationData,
                signingSecret: undefined,
              }),
            },
          };
        }

        if (
          table === "EVENT_TRACKING_RECORDS_TABLE" &&
          pk === "my-tenant-id/my-tracking-id"
        ) {
          return { Item: undefined };
        }

        if (
          table === "CLICK_THROUGH_TRACKING_TABLE_NAME" &&
          trackingId === "my-tracking-id"
        ) {
          return { Item: mockCttRecord };
        }

        throw new Error("Unhandled mock");
      }
    );

    expect(
      await slackWebhookHandler(getMockSlackEvent(mockWebhookData))
    ).toEqual({
      body: JSON.stringify({
        message: "Slack configuration is missing signing secret",
        type: "invalid_request_error",
      }),
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Strict-Transport-Security":
          "max-age=31536000;includeSubDomains;preload",
        "X-Content-Type-Options": "nosniff",
      },
      isBase64Encoded: undefined,
      multiValueHeaders: undefined,
      statusCode: 409,
    });

    expect(createClickedEventSpy.mock.calls).toEqual([]);
    expect(axiosSpy.mock.calls).toEqual([]);
    expect(createWebhookResponseEventSpy.mock.calls).toEqual([]);
  });

  it("should work without an actionId set", async () => {
    dynamoGetItemSpy.mockImplementation(
      async ({
        Key,
        TableName: table,
      }: DocumentClient.GetItemInput): Promise<DocumentClient.GetItemOutput> => {
        const { id, trackingId, pk } = Key;

        if (table === "objects-table" && id === "my-configuration-id") {
          return { Item: mockConfiguration };
        }

        if (
          table === "EVENT_TRACKING_RECORDS_TABLE" &&
          pk === "my-tenant-id/my-tracking-id"
        ) {
          return {
            Item: undefined,
          };
        }

        if (
          table === "CLICK_THROUGH_TRACKING_TABLE_NAME" &&
          trackingId === "my-tracking-id"
        ) {
          return {
            Item: {
              ...mockCttRecord,
              data: {
                ...mockCttRecord.data,
                actionId: undefined,
              },
            },
          };
        }

        throw new Error("Unhandled mock");
      }
    );

    const mockWebhookResponse = {
      data: { myBodyValue: true },
      headers: {
        "X-My-Test-Header": "should be passed on",
      },
      status: 200,
    };

    axiosSpy.mockImplementation(async () => mockWebhookResponse);

    expect(
      await slackWebhookHandler(getMockSlackEvent(mockWebhookData))
    ).toEqual({
      body: JSON.stringify(mockWebhookResponse.data),
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Strict-Transport-Security":
          "max-age=31536000;includeSubDomains;preload",
        "X-Content-Type-Options": "nosniff",
        "X-My-Test-Header": "should be passed on",
      },
      isBase64Encoded: undefined,
      multiValueHeaders: undefined,
      statusCode: mockWebhookResponse.status,
    });

    expect(createClickedEventSpy.mock.calls.length).toBe(1);
    expect(createClickedEventSpy.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "my-tenant-id",
        "my-message-id",
        "slack",
        Object {
          "id": "",
          "taxonomy": "direct_message:*",
        },
        Object {
          "channel": Object {
            "id": "",
            "taxonomy": "direct_message:*",
          },
          "clickHeaders": Object {
            "Accept": "application/json,*/*",
            "Accept-Encoding": "gzip,deflate",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
            "X-Forwarded-For": "127.0.0.1, 192.168.0.1",
            "X-Slack-Request-Timestamp": "123456789",
            "X-Slack-Signature": "v0=e370d34ba455aad7cf3f55694d2d24c9ea54a561672e7cde52035cecd9aa604a",
          },
          "clickIp": "127.0.0.1",
          "clickUserAgent": "mock-user-agent",
          "data": Object {
            "actionId": undefined,
          },
          "forwardingUrl": "https://example.com/webhook-url",
          "messageId": "my-message-id",
          "providerKey": "slack",
          "slackPayload": Object {
            "actions": Array [
              Object {
                "action_id": "my-tracking-id",
              },
            ],
          },
        },
      ]
    `);

    expect(axiosSpy.mock.calls.length).toBe(1);
    expect(axiosSpy.mock.calls[0][0]).toBe("https://example.com/webhook-url");
    expect(axiosSpy.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "data": "payload=%7B%22actions%22%3A%5B%7B%22action_id%22%3A%22my-tracking-id%22%7D%5D%7D",
        "headers": Object {
          "Accept": "application/json,*/*",
          "Accept-Encoding": "gzip,deflate",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
          "X-Forwarded-For": "127.0.0.1, 192.168.0.1",
          "X-Slack-Request-Timestamp": "123456789",
          "X-Slack-Signature": "v0=e370d34ba455aad7cf3f55694d2d24c9ea54a561672e7cde52035cecd9aa604a",
        },
        "method": "post",
        "responseType": "text",
        "validateStatus": [Function],
      }
    `);

    expect(createWebhookResponseEventSpy.mock.calls.length).toBe(1);
    expect(createWebhookResponseEventSpy.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "my-tenant-id",
        "my-message-id",
        Object {
          "body": Object {
            "myBodyValue": true,
          },
          "channel": Object {
            "id": "",
            "taxonomy": "direct_message:*",
          },
          "data": Object {
            "actionId": undefined,
          },
          "headers": Object {
            "X-My-Test-Header": "should be passed on",
          },
          "messageId": "my-message-id",
          "providerKey": "slack",
          "status": 200,
        },
      ]
    `);
  });
});
