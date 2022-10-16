import { RequestV2 } from "~/api/send/types";
import { RequestPayload } from "~/send/service/data/request/request.types";
import { IMessage, IAdHocListAction } from "~/send/types";
import { adHocList } from "../index";

const MOCK_TENANT = "xyz";
const MOCK_REQUEST_ID = "xyz";
const MOCK_MESSAGE_ID = "xyz";
const MOCK_FILE_PATH = "xyz";
const MOCK_SOURCE = "xyz";
const MOCK_ACTION: IAdHocListAction = {
  command: "ad-hoc-list",
  dryRunKey: undefined,
  requestId: MOCK_REQUEST_ID,
  tenantId: MOCK_TENANT,
};
const MOCK_MESSAGE: RequestV2["message"] = {
  to: [
    {
      email: "foo@courier.com",
    },
    {
      email: "bar@courier.com",
    },
    {
      email: "baz@courier.com",
    },
  ],
  content: {
    title: "test",
    body: "test",
  },
  routing: {
    method: "all",
    channels: ["email"],
  },
};

const mock_actionService = jest.fn();
const mock_messageService_create = jest.fn(async () => {
  const message: IMessage = {
    apiVersion: "2019-04-01",
    idempotencyKey: undefined,
    messageId: MOCK_MESSAGE_ID,
    message: MOCK_MESSAGE,
    requestId: MOCK_REQUEST_ID,
    source: MOCK_SOURCE,
  };

  return { message, filePath: MOCK_FILE_PATH };
});
const mock_requestService_getPayload = jest.fn(async () => {
  const request: RequestPayload = {
    apiVersion: "2019-04-01",
    created: new Date().toISOString(),
    dryRunKey: "default",
    filePath: MOCK_FILE_PATH,
    idempotencyKey: undefined,
    jobId: undefined,
    message: MOCK_MESSAGE,
    requestId: MOCK_REQUEST_ID,
    scope: "published/production",
    source: MOCK_SOURCE,
    shard: 5,
    sequenceId: undefined,
    triggerId: undefined,
    translated: undefined,
    updated: new Date().toISOString(),
    workspaceId: MOCK_TENANT,
  };

  return request;
});
const mock_eventLogService = jest.fn(async () => {});
jest.mock("~/send/service/data/request/requests.service", () => () => ({
  getPayload: jest.fn(() => mock_requestService_getPayload()),
}));
jest.mock("~/send/service/messages", () => () => ({
  create: jest.fn(() => mock_messageService_create()),
}));
jest.mock("~/send/service/actions", () => () => ({
  emit: jest.fn(() => mock_actionService()),
}));
jest.mock("~/lib/dynamo/event-logs", () => ({
  EntryTypes: jest.fn(),
  create: jest.fn(() => mock_eventLogService()),
}));

jest.mock("~/lib/get-environment-variable");

describe("provider send handler", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call the dependent services", async () => {
    await adHocList(MOCK_ACTION);

    expect(mock_requestService_getPayload).toHaveBeenCalledTimes(1);
    expect(mock_messageService_create).toHaveBeenCalledTimes(3);
    expect(mock_actionService).toHaveBeenCalledTimes(3);
    expect(mock_eventLogService).toHaveBeenCalledTimes(3);
  });
});
