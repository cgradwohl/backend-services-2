import { paramCase } from "param-case";
import downgrade from "~/lib/notifications/downgrade";
import upgrade from "~/lib/notifications/upgrade";
import * as fixtures from "./__fixtures__";

jest.mock("aws-sdk", () => {
  const mockDocumentClient = {
    batchGet: (params) => {
      return {
        promise: () => ({
          Responses: {
            [Object.keys(params.RequestItems)[0]]: fixtures.configurations,
          },
        }),
      };
    },
    get: (params) => {
      return {
        promise: () => {
          const itemKey = Object.keys(fixtures.strategies).find(
            (key) => fixtures.strategies[key].id === params.Key.id
          );
          return itemKey ? { Item: fixtures.strategies[itemKey] } : null;
        },
      };
    },
  };

  const mockS3Client = {
    createPresignedPost: jest.fn().mockReturnValue({ promise: () => null }),
    getObject: jest.fn().mockReturnValue({ promise: () => null }),
    putObject: jest.fn().mockReturnValue({ promise: () => null }),
  };

  const mockSQSClient = {
    getQueueUrl: jest.fn().mockReturnValue({ promise: () => "queue-url" }),
    sendMessage: jest.fn().mockReturnValue({ promise: () => null }),
  };

  return {
    config: {
      update: jest.fn(),
    },
    CognitoIdentityServiceProvider: jest.fn(),
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDocumentClient),
    },
    S3: jest.fn(() => mockS3Client),
    SQS: jest.fn(() => mockSQSClient),
  };
});

afterEach(() => {
  jest.resetAllMocks();
});

const excluded = ["configurations", "strategies"];
Object.keys(fixtures).forEach(async (fixture) => {
  if (excluded.indexOf(fixture) > -1) {
    return;
  }

  it(`should properly downgrade an upgraded notification (${paramCase(
    fixture
  )})`, async () => {
    const upgraded = await upgrade(fixtures[fixture]);
    const notification = downgrade(upgraded);
    expect(notification).toStrictEqual(fixtures[fixture]);
  });
});
