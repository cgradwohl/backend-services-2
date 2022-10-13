import { APIGatewayProxyEvent } from "aws-lambda";
import handler from "~/automations/api/invoke";

jest.mock("~/lib/get-environment-variable");

const createRequest = ({
  payload,
  pathParams,
  tenantId,
  traceId,
}): APIGatewayProxyEvent => ({
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
  pathParameters: pathParams ? pathParams : null,
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

jest.mock("~/lib/sentry", () => ({
  withScope: jest.fn(() => {}),
}));
jest.mock("~/lib/dynamo", () => ({
  getItem: jest.fn(),
}));

const tenantId = "1234-5678";
const traceId = "12345-678910";

describe("Automation Api Handler Initial Validation", () => {
  // let response;
  // beforeAll(async () => {
  //   response = await handler(request);
  // });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("should throw a bad request, if `override` key is passed", async () => {
    const payload = {
      automation: {
        steps: [
          {
            action: "send",
            profile: {
              email: "chris@courier.com",
            },
            template: "TEST",
            recipient: "abc-123",
            data: {
              title: "TEST",
            },
          },
        ],
      },
      override: { foo: "bar" },
    };
    const request = createRequest({
      payload,
      traceId,
      tenantId,
      pathParams: null,
    });
    const { statusCode, body } = await handler(request);

    expect(statusCode).toBe(400);
    expect(body).toBe(
      `{"message":"Invalid request property. 'override' is only applicable to send and send-list steps.","type":"invalid_request_error"}`
    );
  });
  it("should throw a bad request, if `automation` key is missing", async () => {
    const payload = {
      steps: [
        {
          action: "send",
          profile: {
            email: "chris@courier.com",
          },
          template: "TEST",
          recipient: "abc-123",
          data: {
            title: "TEST",
          },
        },
      ],
    };
    const request = createRequest({
      payload,
      traceId,
      tenantId,
      pathParams: null,
    });
    const { statusCode, body } = await handler(request);

    expect(body).toBe(
      `{"message":"Either an ad hoc automation or valid templateId is required.","type":"invalid_request_error"}`
    );
    expect(statusCode).toBe(400);
  });

  it("should throw a bad request if `steps` are missing from the ad hoc automation.", async () => {
    const payload = {
      automation: [
        {
          action: "send",
          profile: {
            email: "chris@courier.com",
          },
          template: "TEST",
          recipient: "abc-123",
          data: {
            title: "TEST",
          },
        },
      ],
    };
    const request = createRequest({
      payload,
      traceId,
      tenantId,
      pathParams: null,
    });
    const { statusCode, body } = await handler(request);

    expect(body).toBe(
      `{"message":"Invalid automation definition. An array of valid steps is required.","type":"invalid_request_error"}`
    );
    expect(statusCode).toBe(400);
  });
});
