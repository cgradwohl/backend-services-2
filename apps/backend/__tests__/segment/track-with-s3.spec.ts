import uuid from "uuid";
import { createMd5Hash } from "~/lib/crypto-helpers";
import * as dynamo from "~/lib/dynamo";
import mockJsonStore from "~/lib/s3";
import incomingSegmentEventService from "~/segment/services/incoming-events";
import {
  IInboundSegmentTrackRequest,
  InboundSegmentRequestTypesEnum,
} from "~/segment/types";

jest.mock("~/lib/get-environment-variable");
jest.mock("nanoid", () => ({
  nanoid: () => "1234",
}));

const TENANT_ID = "33ff952a-a8c7-4d70-9a06-ffafe72ce8f0";

const SEGMENT_EVENT = {
  anonymousId: uuid.v4(),
  event: "imma test event",
  messageId: uuid.v4(),
  properties: {
    immaproperty: "immavalue",
  },
  receivedAt: Date.now().toString(),
  timestamp: Date.now().toString(),
  type: "track",
  userId: uuid.v4(),
};

const EVENT_ID = `${InboundSegmentRequestTypesEnum.TRACK}/${SEGMENT_EVENT.event}`;
const HASH = createMd5Hash(EVENT_ID);
const S3_FILE_PATH = `${555}/1234/${HASH}.json`;
const PK = `${TENANT_ID}/${EVENT_ID}`;

// set a hard coded date time for testing purposes
jest.spyOn(Date.prototype, "getMilliseconds").mockReturnValue(555);

jest.mock("~/lib/capture-exception", () => {
  return jest.fn();
});
jest.mock("~/lib/dynamo", () => {
  return {
    put: jest.fn(),
    query: jest.fn(),
    getItem: jest.fn(),
    update: jest.fn(),
  };
});
const mockDynamoGetItem = dynamo.getItem as jest.Mock;
const mockDynamoPut = dynamo.put as jest.Mock;

jest.mock("~/lib/s3", () => {
  const put = jest.fn();
  const get = jest.fn();
  return jest.fn(() => ({
    put,
    get,
  }));
});
const mockS3Put = (mockJsonStore as jest.Mock)().put;
const mockS3Get = (mockJsonStore as jest.Mock)().get;

describe("when incoming segment track events are recieved: ", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should PUT them into both DynamoDB and S3 store", async () => {
    const service = incomingSegmentEventService(TENANT_ID);
    await service.put(SEGMENT_EVENT as IInboundSegmentTrackRequest);

    expect(mockS3Put.mock.calls.length).toBe(1);
    expect(mockS3Put.mock.calls[0][0]).toBe(S3_FILE_PATH);
    expect(mockS3Put.mock.calls[0][1]).toStrictEqual(SEGMENT_EVENT);
    expect(mockDynamoPut).toBeCalledTimes(1);
  });

  it("should GET item from DynamoDB", async () => {
    const service = incomingSegmentEventService(TENANT_ID);
    await service.get(PK);

    expect(mockDynamoGetItem.mock.calls.length).toBe(1);
  });

  it("should List items fetched from both DynamoDB and S3 store", async () => {
    const mockDynamoQuery = (dynamo.query as jest.Mock).mockReturnValue({
      Items: [{ s3Pointer: S3_FILE_PATH }],
    });
    const mockS3Get = (mockJsonStore as jest.Mock)().get;

    const service = incomingSegmentEventService(TENANT_ID);
    await service.list();

    expect(mockDynamoQuery).toBeCalled();
    expect(mockS3Get).toBeCalled();
  });

  it("should List items fetched from DynamoDB only and not hit S3 store", async () => {
    const mockDynamoQuery = (dynamo.query as jest.Mock).mockReturnValue({
      Items: [{}],
    });
    const mockS3Get = (mockJsonStore as jest.Mock)().get;

    const service = incomingSegmentEventService(TENANT_ID);
    await service.list();

    expect(mockDynamoQuery).toBeCalled();
    expect(mockS3Get).toBeCalledTimes(0);
  });
});
