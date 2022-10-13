const mockPutRecord = jest.fn().mockReturnValue({
  promise: jest.fn().mockResolvedValue(undefined),
});

import { putRecord } from "~/lib/kinesis/firehose";

jest.mock("aws-sdk", () => {
  return {
    Firehose: function () {
      return {
        putRecord: mockPutRecord,
      };
    },
  };
});

const UUID_REGEX =
  "^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$";

const generateTestJson = () => {
  return {
    a: "a".repeat(500),
    b: "yeet".repeat(100),
    c: 50,
  };
};

describe("putRecord should write correct records to kinesis", async () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should write original in case of no chunking", async () => {
    const json = generateTestJson();
    const mockRecord = {
      DeliveryStreamName: "TEST_STREAM",
      Record: {
        Data: JSON.stringify(json),
      },
    };

    await putRecord(mockRecord, { chunkRecord: false });
    expect(mockPutRecord).toBeCalledWith(mockRecord);
  });

  it("should output chunks which combine for the original record", async () => {
    const json = generateTestJson();
    const firehoseRecord = {
      DeliveryStreamName: "TEST_STREAM",
      Record: {
        Data: JSON.stringify(json),
      },
    };

    await putRecord(firehoseRecord, { chunkSize: 100 });

    // throw new Error(JSON.stringify(mockPutRecord.mock.calls));

    const putRecordChunks = mockPutRecord.mock.calls
      .map((args) => JSON.parse(args[0].Record.Data).chunk)
      .join("");

    expect(JSON.parse(putRecordChunks)).toStrictEqual(json);
  });

  it("should attach the correct kinesis data to the chunks", async () => {
    const json = generateTestJson();
    const firehoseRecord = {
      DeliveryStreamName: "TEST_STREAM",
      Record: {
        Data: JSON.stringify(json),
      },
    };

    await putRecord(firehoseRecord, { chunkSize: 100 });
    const parsedChunkData = mockPutRecord.mock.calls.map((args) =>
      JSON.parse(args[0].Record.Data)
    );
    // );

    // We run these tests on individual fields rather than each chunk
    // to make test failures easier to read and debug, although it makes
    // the test more complicated since we need to generate all the arrays
    // _and_ expected data in them

    const chunkIndices = parsedChunkData.map(
      (data) => data.kinesisSequenceNumber
    );
    expect(chunkIndices).toMatchObject([
      ...Array(parsedChunkData.length).keys(),
    ]);

    const expectedKinesisSequenceTotals = Array(parsedChunkData.length);
    expectedKinesisSequenceTotals.fill(parsedChunkData.length);
    const chunkTotals = parsedChunkData.map(
      (data) => data.kinesisSequenceTotal
    );
    expect(chunkTotals).toMatchObject(expectedKinesisSequenceTotals);

    const firstRecordId = parsedChunkData[0].kinesisRecordId;
    expect(firstRecordId.match(UUID_REGEX)).toBeTruthy();

    const expectedKinesisRecordIds = Array(parsedChunkData.length);
    expectedKinesisRecordIds.fill(firstRecordId);
    const recordIds = parsedChunkData.map((data) => data.kinesisRecordId);
    expect(recordIds).toMatchObject(expectedKinesisRecordIds);
  });
});
