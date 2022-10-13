import { APIGatewayProxyEvent } from "aws-lambda/trigger/api-gateway-proxy";
import { send } from "~/api/send";

const dynamoMessagesSpy = jest.fn();
const dynamoEventLogsSpy = jest.fn();
const dynamoOverflowSpy = jest.fn();
const s3Spy = jest.fn((key, value) => ({ [key]: value }));
const sqsSpy = jest.fn();
const putRecordSpy = jest.fn();

jest.mock("~/lib/kinesis", () => ({
  putRecord: (value) => putRecordSpy(value),
}));

jest.mock("~/lib/s3", () => () => ({
  put: jest.fn((key, value) => s3Spy(key, value)),
}));

jest.mock("~/lib/dynamo/event-logs", () => ({
  createRequestReceivedEvent: (tenantId, messageId) =>
    dynamoEventLogsSpy(tenantId, messageId),
  EntryTypes: {
    eventReceived: "event:received",
  },
}));

jest.mock("~/lib/dynamo/messages", () => ({
  create: (tenantId, event) => dynamoMessagesSpy(tenantId, event),
}));

jest.mock("~/lib/enqueue", () => ({
  enqueueByQueueUrl: () => jest.fn((data) => sqsSpy(data)),
}));

jest.mock("~/overflow/service", () => () => ({
  create: dynamoOverflowSpy,
  isOverflowTenant: (value) => value === "i-am-test-overflow-enabled-eventId",
}));

jest.mock("~/lib/sentry", () => ({
  withScope: jest.fn(() => {}),
}));

jest.mock("~/lib/logger", () => {
  return {
    CourierLogger: jest.fn().mockImplementation(() => {
      const loggerMocks = {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        fatal: jest.fn(),
      };
      return {
        logger: {
          child: jest.fn().mockReturnValue({
            ...loggerMocks,
          }),
          ...loggerMocks,
        },
        ...loggerMocks,
      };
    }),
  };
});

const createRequest = ({ payload, tenantId }): APIGatewayProxyEvent => ({
  resource: "/send",
  path: "/send",
  httpMethod: "POST",
  headers: {
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    Authorization: "Bearer YOUR_SECRET_TOKEN",
    "CloudFront-Forwarded-Proto": "https",
    "CloudFront-Is-Desktop-Viewer": "true",
    "CloudFront-Is-Mobile-Viewer": "false",
    "CloudFront-Is-SmartTV-Viewer": "false",
    "CloudFront-Is-Tablet-Viewer": "false",
    "CloudFront-Viewer-Country": "US",
    "Content-Type": "application/json",
    Host: "v7ckd80pf4.execute-api.us-east-1.amazonaws.com",
    "Postman-Token": "40e18ff4-77b6-44fa-a2a6-5a3e5a8845c1",
    "User-Agent": "PostmanRuntime/7.28.4",
    Via: "1.1 100e7eca600d702a8613a94cb0899fe9.cloudfront.net (CloudFront)",
    "X-Amz-Cf-Id": "TB1xsJvxhv89znvaqM9xHJncpVeZbPEozfKh51xDdy4UDzQg-h0Biw==",
    "X-Forwarded-For": "71.202.189.238, 70.132.61.144",
    "X-Forwarded-Port": "443",
    "X-Forwarded-Proto": "https",
  },
  multiValueHeaders: {
    Accept: ["*/*"],
    "Accept-Encoding": ["gzip, deflate, br"],
    Authorization: ["Bearer YOUR_SECRET_TOKEN"],
    "CloudFront-Forwarded-Proto": ["https"],
    "CloudFront-Is-Desktop-Viewer": ["true"],
    "CloudFront-Is-Mobile-Viewer": ["false"],
    "CloudFront-Is-SmartTV-Viewer": ["false"],
    "CloudFront-Is-Tablet-Viewer": ["false"],
    "CloudFront-Viewer-Country": ["US"],
    "Content-Type": ["application/json"],
    Host: ["v7ckd80pf4.execute-api.us-east-1.amazonaws.com"],
    "Postman-Token": ["40e18ff4-77b6-44fa-a2a6-5a3e5a8845c1"],
    "User-Agent": ["PostmanRuntime/7.28.4"],
    Via: ["1.1 100e7eca600d702a8613a94cb0899fe9.cloudfront.net (CloudFront)"],
    "X-Amz-Cf-Id": ["TB1xsJvxhv89znvaqM9xHJncpVeZbPEozfKh51xDdy4UDzQg-h0Biw=="],
    "X-Forwarded-For": ["71.202.189.238, 70.132.61.144"],
    "X-Forwarded-Port": ["443"],
    "X-Forwarded-Proto": ["https"],
  },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  pathParameters: null,
  stageVariables: null,
  requestContext: {
    resourceId: "iirpq3",
    authorizer: {
      scope: "published/production",
      tenantId,
      principalId: "user",
      integrationLatency: 1538,
    },
    resourcePath: "/send",
    httpMethod: "POST",
    extendedRequestId: "HkbhsEcgIAMFlsw=",
    requestTime: "21/Oct/2021:17:40:26 +0000",
    path: "/dev/send",
    accountId: "327732143687",
    protocol: "HTTP/1.1",
    stage: "dev",
    domainPrefix: "v7ckd80pf4",
    requestTimeEpoch: 1634838026684,
    requestId: "4c112c24-f3ea-42de-b709-17c7e9cac39f",
    identity: {
      apiKey: null,
      apiKeyId: null,
      cognitoIdentityPoolId: null,
      accountId: null,
      cognitoIdentityId: null,
      caller: null,
      sourceIp: "71.202.189.238",
      principalOrgId: null,
      accessKey: null,
      cognitoAuthenticationType: null,
      cognitoAuthenticationProvider: null,
      userArn: null,
      userAgent: "PostmanRuntime/7.28.4",
      user: null,
    },
    domainName: "v7ckd80pf4.execute-api.us-east-1.amazonaws.com",
    apiId: "v7ckd80pf4",
  },
  body: JSON.stringify(payload),
  isBase64Encoded: false,
});

describe("/send API Handler for valid V2 request", () => {
  const request = createRequest({
    payload: {
      message: {
        to: {
          email: "chris@courier.com",
        },
        content: {
          title: "Your Courier test send",
          body: "Hello! This is an email sent using the Courier API.",
        },
      },
    },
    tenantId: "1234-5678-abcd-efgh",
  });

  let response;
  beforeAll(async () => {
    response = await send(request);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("should write to SendRequestsBucket", () => {
    const result = s3Spy.mock.calls[0][0];
    const expected = "_request.json";

    expect(result).toContain(expected);
  });

  it("should enqueue first action onto V2 Kinesis Stream", () => {
    const result = putRecordSpy.mock.calls[0][0];
    const expected = {
      tenantId: "1234-5678-abcd-efgh",
    };
    expect(result.Data.messageId).toBeUndefined();
    expect(result.Data.requestId).toBeDefined();
    expect(result.Data.tenantId).toBe(expected.tenantId);
  });

  it("should __NOT__ create the V1 message item", () => {
    const result = dynamoMessagesSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should __NOT__ write into the MessagesBucket", () => {
    const result = s3Spy.mock.calls[0][0];
    const expected =
      "1234-5678-abcd-efgh/prepare_1-12345678-abcdefghijklmnopqrstuvwx.json";

    expect(result === expected).toBeFalsy();
  });

  it("should __NOT__ create the event log records", () => {
    const result = dynamoEventLogsSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should __NOT__ enqueue onto SqsPrepare", () => {
    const result = sqsSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should __NOT__ create the overflow item", () => {
    const result = dynamoOverflowSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should return a requestId", () => {
    const result = JSON.parse(response.body)?.requestId;

    expect(result).toBeDefined();
  });

  it("should return 202 status code.", () => {
    expect(response.statusCode).toBe(202);
  });
});

describe("/send API Handler for valid V1 request, (V2 enabled, overflow N/A)", () => {
  const request = createRequest({
    payload: {
      message: {
        to: {
          email: "chris@courier.com",
        },
        content: {
          title: "Your Courier test send",
          body: "Hello! This is an email sent using the Courier API.",
        },
      },
    },
    tenantId: "i-am-test-v2-pipeline-enabled-tenant",
  });

  let response;
  beforeAll(async () => {
    response = await send(request);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  // TODO:
  // it("should translate the V1 request into a V2 request", () => {});

  it("should write to SendRequestsBucket", () => {
    const result = s3Spy.mock.calls[0][0];
    const expected = "_request.json";

    expect(result).toContain(expected);
  });

  it("should enqueue first action onto V2 Kinesis Stream", () => {
    const result = putRecordSpy.mock.calls[0][0];
    const expected = {
      tenantId: "i-am-test-v2-pipeline-enabled-tenant",
    };
    expect(result.Data.messageId).toBeUndefined();
    expect(result.Data.requestId).toBeDefined();
    expect(result.Data.tenantId).toBe(expected.tenantId);
  });

  it("should __NOT__ create the V1 message item", () => {
    const result = dynamoMessagesSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should __NOT__ write into the MessagesBucket", () => {
    const result = s3Spy.mock.calls[0][0];
    const expected =
      "1234-5678-abcd-efgh/prepare_1-12345678-abcdefghijklmnopqrstuvwx.json";

    expect(result === expected).toBeFalsy();
  });

  it("should __NOT__ create the event log records", () => {
    const result = dynamoEventLogsSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should __NOT__ enqueue onto SqsPrepare", () => {
    const result = sqsSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should __NOT__ create the overflow item", () => {
    const result = dynamoOverflowSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should return a requestId", () => {
    const result = JSON.parse(response.body)?.requestId;
    expect(result).toBeDefined();
  });

  it("should return 202 status code.", () => {
    expect(response.statusCode).toBe(202);
  });
});

describe("/send API Handler for valid V1 request, (V2 disabled, overflow enabled)", () => {
  const request = createRequest({
    payload: {
      event: "i-am-test-overflow-enabled-eventId",
      recipient: "abc-123",
      data: {
        name: "DUDE !",
      },
      profile: {
        email: "chris@courier.com",
      },
      brand: "",
    },
    tenantId: "i-am-test-overflow-enabled-tenant",
  });

  let response;
  beforeAll(async () => {
    response = await send(request);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("should create the V1 message item", () => {
    const [tenantId, event] = dynamoMessagesSpy.mock.calls[0];
    const expectedTenantId = "i-am-test-overflow-enabled-tenant";
    const expectedEvent = "i-am-test-overflow-enabled-eventId";

    expect(tenantId).toBe(expectedTenantId);
    expect(event).toBe(expectedEvent);
  });

  it("should write into the MessagesBucket", () => {
    const result = s3Spy.mock.calls[0][0];

    expect(result).toContain("i-am-test-overflow-enabled-tenant/prepare_1");
    expect(result).toContain(".json");
  });

  it("should create the event log records", () => {
    const [{ tenantId, requestId }] = dynamoEventLogsSpy.mock.calls[0];
    const expectedTenantId = "i-am-test-overflow-enabled-tenant";

    expect(tenantId).toBe(expectedTenantId);
    expect(requestId).toContain("1-");
  });

  it("should create the overflow item", () => {
    const result = dynamoOverflowSpy.mock.calls[0][0];
    const expected = {
      created: "2021-10-21T22:27:27.030Z",
      filePath:
        "i-am-test-overflow-enabled-tenant/prepare_1-12345678-abcdefghijklmnopqrstuvwx.json",
      tenantId: "i-am-test-overflow-enabled-tenant",
    };

    expect(result.filePath).toContain(
      "i-am-test-overflow-enabled-tenant/prepare_1"
    );
    expect(result.filePath).toContain(".json");
    expect(result.messageId).toBeDefined();
    expect(result.tenantId).toBe(expected.tenantId);
  });

  it("should __NOT__ enqueue onto SqsPrepare", () => {
    const result = sqsSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should __NOT__ write to SendRequestsBucket", () => {
    const result = s3Spy.mock.calls[0][0];
    const expected =
      "i-am-test-overflow-enabled-tenant/1-12345678-abcdefghijklmnopqrstuvwx/request.json";

    expect(result === expected).toBeFalsy();
  });

  it("should return a messageId", () => {
    const result = JSON.parse(response.body)?.messageId;
    expect(result).toContain("1-");
  });

  it("should return 200 status code.", () => {
    expect(response.statusCode).toBe(200);
  });
});

describe("/send API Handler for valid V1 request, (V2 disabled, overflow disabled)", () => {
  const request = createRequest({
    payload: {
      event: "SQUIRRELL",
      recipient: "abc-123",
      data: {
        name: "DUDE !",
      },
      profile: {
        email: "chris@courier.com",
      },
      brand: "",
    },
    tenantId: "1234-5678-abcd-efgh",
  });

  let response;
  beforeAll(async () => {
    response = await send(request);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("should create the V1 message item", () => {
    const [tenantId, event] = dynamoMessagesSpy.mock.calls[0];
    const expectedTenantId = "1234-5678-abcd-efgh";
    const expectedEvent = "SQUIRRELL";

    expect(tenantId).toBe(expectedTenantId);
    expect(event).toBe(expectedEvent);
  });

  it("should write into the MessagesBucket", () => {
    const result = s3Spy.mock.calls[0][0];
    const expected =
      "1234-5678-abcd-efgh/prepare_1-12345678-abcdefghijklmnopqrstuvwx.json";

    expect(result).toContain("1234-5678-abcd-efgh/prepare_1");
    expect(result).toContain(".json");
  });

  it("should create the event log records", () => {
    const [{ tenantId, requestId }] = dynamoEventLogsSpy.mock.calls[0];
    const expectedTenantId = "1234-5678-abcd-efgh";

    expect(tenantId).toBe(expectedTenantId);
    expect(requestId).toBeDefined();
  });

  it("should enqueue onto SqsPrepare", () => {
    const result = sqsSpy.mock.calls[0][0];
    const expected = {
      messageId: "1-12345678-abcdefghijklmnopqrstuvwx",
      messageLocation: {
        path: "1234-5678-abcd-efgh/prepare_1-12345678-abcdefghijklmnopqrstuvwx.json",
        type: "S3",
      },
      tenantId: "1234-5678-abcd-efgh",
      type: "prepare",
    };

    expect(result.messageId).toContain("1-");
    expect(result.messageLocation.path).toContain(
      "1234-5678-abcd-efgh/prepare_1-"
    );
    expect(result.messageLocation.path).toContain(".json");
    expect(result.tenantId).toBe(expected.tenantId);
  });

  it("should __NOT__ write to SendRequestsBucket", () => {
    const result = s3Spy.mock.calls[0][0];
    const expected =
      "1234-5678-abcd-efgh/1-12345678-abcdefghijklmnopqrstuvwx/request.json";

    expect(result === expected).toBeFalsy();
  });

  // it("should __NOT__ enqueue onto V2 Kinesis Stream", () => {});

  it("should __NOT__ create the overflow item", () => {
    const result = dynamoOverflowSpy.mock.calls[0];
    const expected = undefined;

    expect(result).toBe(expected);
  });

  it("should return a messageId", () => {
    const result = JSON.parse(response.body)?.messageId;
    expect(result).toContain("1-");
  });

  it("should return 200 status code.", () => {
    expect(response.statusCode).toBe(200);
  });
});

describe("Invalid V1 /send Request", () => {
  it("should return Bad Request for missing `event`.", async () => {
    const request = createRequest({
      payload: {
        recipient: "abc-123",
        data: {
          name: "DUDE !",
        },
        profile: {
          email: "chris@courier.com",
        },
        brand: "",
      },
      tenantId: "1234-5678-abcd-efgh",
    });
    const response = await send(request);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(
      `{"message":"The 'event' parameter is required.","status":400}`
    );
  });

  it("should return Bad Request for missing `recipient`.", async () => {
    const request = createRequest({
      payload: {
        event: "SQUIRRELL",
        data: {
          name: "DUDE !",
        },
        profile: {
          email: "chris@courier.com",
        },
        brand: "",
      },
      tenantId: "1234-5678-abcd-efgh",
    });

    const response = await send(request);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(
      `{"message":"The 'recipient' parameter is required.","status":400}`
    );
  });

  it("should allow null for optional JSON fields", async () => {
    const request = createRequest({
      payload: {
        event: "SQUIRRELL",
        recipient: "abc-123",
        data: null,
        profile: null,
        preferences: null,
        override: null,
        brand: "",
      },
      tenantId: "1234-5678-abcd-efgh",
    });

    const response = await send(request);

    expect(response.statusCode).toBe(200);
  });

  it("should throw if request.data is not valid JSON.", async () => {
    const request = createRequest({
      payload: {
        event: "SQUIRRELL",
        recipient: "abc-123",
        data: "I AM INVALID",
        brand: "",
      },
      tenantId: "1234-5678-abcd-efgh",
    });

    const response = await send(request);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(
      `{"message":"Invalid definition for property 'data'. The 'data' property must be either a valid JSON object or stringified JSON.","type":"invalid_request_error"}`
    );
  });

  it("should not throw if request.data is an array.", async () => {
    const request = createRequest({
      payload: {
        event: "SQUIRRELL",
        recipient: "abc-123",
        data: ["i am fine"],
        brand: "",
      },
      tenantId: "1234-5678-abcd-efgh",
    });

    const response = await send(request);

    expect(response.statusCode).toBe(200);
    // expect(response.body).toBe(
    //   `{"message":"Invalid definition for property 'data'. The 'data' property must be either a valid JSON string or a valid JSON object.","type":"invalid_request_error"}`
    // );
  });

  it("should not throw if request.data is a valid JSON string.", async () => {
    const request = createRequest({
      payload: {
        event: "SQUIRRELL",
        recipient: "abc-123",
        data: '{ "firstname": "Drew" }',
        brand: "",
      },
      tenantId: "1234-5678-abcd-efgh",
    });

    const response = await send(request);

    expect(response.statusCode).toBe(200);
  });

  it("should not throw if request.data is not defined.", async () => {
    const request = createRequest({
      payload: {
        event: "SQUIRRELL",
        recipient: "abc-123",
        data: undefined,
        brand: "",
      },
      tenantId: "1234-5678-abcd-efgh",
    });

    const response = await send(request);

    expect(response.statusCode).toBe(200);
  });

  it("should not throw if request.data is a valid JSON string.", async () => {
    const request = createRequest({
      payload: {
        event: "SQUIRRELL",
        recipient: "abc-123",
        data: JSON.stringify({ foo: "bar" }),
        brand: "",
      },
      tenantId: "1234-5678-abcd-efgh",
    });

    const response = await send(request);

    expect(response.statusCode).toBe(200);
  });

  it("should not throw if request.data is a valid object.", async () => {
    const request = createRequest({
      payload: {
        event: "SQUIRRELL",
        recipient: "abc-123",
        data: { foo: "bar" },
        brand: "",
      },
      tenantId: "1234-5678-abcd-efgh",
    });

    const response = await send(request);

    expect(response.statusCode).toBe(200);
  });
});

// TODO:
// describe("Invalid V2 /send Request", () => {})
