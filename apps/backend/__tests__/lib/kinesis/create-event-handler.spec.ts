import { Context } from "aws-lambda";
import { AWSError } from "aws-sdk";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});

jest.mock("~/lib/dynamo/sequence-service", () => {
  return {
    sequenceService: (tableName: string, lambdaFunction: string) => {
      expect(tableName).toBe("test-sequence-table-name");
      expect(lambdaFunction).toBe("EventLogsUpdateMessageStatus");

      return {
        async putSequence(sequenceNumber) {
          expect(sequenceNumber).toBe(
            "49524952495249524952495249524952495249524952495249524952495249524"
          );
        },
      };
    },
  };
});

const mockKinesisRecords = {
  Records: [
    {
      awsRegion: "us-east-1",
      eventID:
        "shardId-000000000000:49620962285149742641922244782149020912941308130426355714",
      eventName: "aws:kinesis:record",
      eventSource: "aws:kinesis",
      eventSourceARN:
        "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
      eventVersion: "1.0",
      invokeIdentityArn: "arn:aws:iam:123456789012:role/kinesis_role", // eslint-disable-line camelcase
      kinesis: {
        approximateArrivalTimestamp: 1549450105817,
        data: "eyJ0ZW5hbnRJZCI6IjI5OTZlNWI4LTAyYzktNGQ0My1hNTFkLWJlM2RiYWRmZDJhYyIsImpzb24iOnsiZGV0YWlscyI6eyJjaGFubmVsU3VtbWFyeSI6W3siY2hhbm5lbCI6ImVtYWlsIiwic2VsZWN0ZWQiOmZhbHNlLCJyZWFzb24iOiJDSEFOTkVMX0RJU0FCTEVEIn0seyJjaGFubmVsIjoicHVzaC11bmRlZmluZWQiLCJzZWxlY3RlZCI6ZmFsc2UsInJlYXNvbiI6IkNIQU5ORUxfRElTQUJMRUQifSx7ImNoYW5uZWwiOiJzbXMiLCJzZWxlY3RlZCI6ZmFsc2UsInJlYXNvbiI6IkNIQU5ORUxfRElTQUJMRUQifSx7ImNoYW5uZWwiOiJkaXJlY3RfbWVzc2FnZSIsInNlbGVjdGVkIjpmYWxzZSwicmVhc29uIjoiQ0hBTk5FTF9ESVNBQkxFRCJ9XSwicHJlZmVyZW5jZXMiOnsiY2F0ZWdvcmllcyI6bnVsbCwibm90aWZpY2F0aW9ucyI6bnVsbH19fSwibWVzc2FnZUlkIjoiMS02MTE0ODFkYi00MWVjYmJhNWZiOWI1YWNmYjYzN2M1NmEiLCJpZCI6IjRjMzBjMjE5LTM5YjQtNDljMC05MTQ3LTdlMTIxYWNlMTM4MiIsInR5cGUiOiJldmVudDpyb3V0ZWQiLCJ0aW1lc3RhbXAiOjE2Mjg3MzM5MjA2MzR9",
        kinesisSchemaVersion: "1.0",
        partitionKey: "partitionKey-3",
        sequenceNumber:
          "49524952495249524952495249524952495249524952495249524952495249524",
      },
    },
  ],
};

const fakeContext: Context = {
  awsRequestId: "8F1A7A3C-F869-4B8C-B8F6-6F6B054C7B0C",
  callbackWaitsForEmptyEventLoop: false,
  done: jest.fn(),
  fail: jest.fn(),
  functionName: "EventLogsUpdateMessageStatus",
  functionVersion: "1",
  getRemainingTimeInMillis: jest.fn(),
  invokedFunctionArn:
    "arn:aws:lambda:us-east-1:123456789012:function:EventLogsUpdateMessageStatus",
  logGroupName: "/aws/lambda/EventLogsUpdateMessageStatus",
  logStreamName: "2016/03/28/[$LATEST]8F1A7A3C-F869-4B8C-B8F6-6F6B054C7B0C",
  memoryLimitInMB: "128",
  succeed: jest.fn(),
};

describe(`createEventHandlerWithFailures`, () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it(`should throw an error if sequenceTableName is not provided`, () => {
    expect(() => {
      createEventHandlerWithFailures(
        jest.fn().mockResolvedValue(""),
        undefined
      );
    }).toThrowError();
  });

  it(`should it to kinesis record handler`, () => {
    expect(
      createEventHandlerWithFailures(
        jest.fn().mockResolvedValue(""),
        "test-sequence-table-name"
      )
    ).toBeDefined();
  });

  it(`handler should be able to handle records`, async () => {
    const handler = createEventHandlerWithFailures(
      jest.fn().mockResolvedValue(""),
      "test-sequence-table-name"
    );
    expect(
      await handler(
        mockKinesisRecords,
        fakeContext,
        jest.fn().mockResolvedValue("")
      )
    ).toMatchObject({ batchItemFailures: [] });
  });

  it(`should return batchItemFailures on failed stream record`, async () => {
    const handler = createEventHandlerWithFailures(
      jest.fn().mockRejectedValue(new Error("test error")),
      "test-sequence-table-name"
    );
    expect(
      await handler(mockKinesisRecords, fakeContext, jest.fn())
    ).toMatchObject({
      batchItemFailures: [
        {
          itemIdentifier:
            "49524952495249524952495249524952495249524952495249524952495249524",
        },
      ],
    });
  });

  it(`should not retry non-retryable errors`, async () => {
    const error = new Error("test error");
    (error as AWSError).retryable = false;

    const handler = createEventHandlerWithFailures(
      jest.fn().mockRejectedValue(error),
      "test-sequence-table-name"
    );

    expect(
      await handler(mockKinesisRecords, fakeContext, jest.fn())
    ).toMatchObject({
      batchItemFailures: [],
    });
  });

  it("should not call handle if event is filtered out", () => {
    const handler = jest.fn();
    createEventHandlerWithFailures(handler, "test-sequence-table-name", {
      filter: () => false,
    });
    expect(handler).not.toBeCalled();
  });
});
