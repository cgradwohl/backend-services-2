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
      list_id: "my_list",
    },
    {
      list_pattern: "new_users.*",
    },
    {
      email: "baz@courier.com",
    },
    {
      user_id: "123",
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

const mock_requestService_create = jest.fn();
const mock_eventLogService_create = jest.fn(async () => {});
jest.mock("~/send/service/data/request/requests.service", () => () => ({
  getPayload: jest.fn(() => mock_requestService_getPayload()),
  create: jest.fn(() => mock_requestService_create()),
}));
jest.mock("~/send/service/messages", () => () => ({
  create: jest.fn(() => mock_messageService_create()),
}));
jest.mock("~/send/service/actions", () => () => ({
  emit: jest.fn(() => mock_actionService()),
}));
jest.mock("~/lib/dynamo/event-logs", () => ({
  EntryTypes: jest.fn(),
  create: jest.fn(() => mock_eventLogService_create()),
}));

jest.mock("~/lib/get-environment-variable");

describe("provider send handler", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call the dependent services", async () => {
    await adHocList(MOCK_ACTION);

    expect(mock_requestService_getPayload).toHaveBeenCalledTimes(1);

    // create a new request for the list_id and list_pattern recipient
    expect(mock_requestService_create).toHaveBeenCalledTimes(2);

    // create a new message for the email and user_id recipient
    expect(mock_messageService_create).toHaveBeenCalledTimes(2);

    // emit 4 actions, 1 for each recipient
    expect(mock_actionService).toHaveBeenCalledTimes(4);

    // create two event receieved events for each user recipient
    expect(mock_eventLogService_create).toHaveBeenCalledTimes(2);
  });
});
