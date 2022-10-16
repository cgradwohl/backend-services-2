import { RequestV2 } from "~/api/send/types";
import { IListItem } from "~/lib/lists/types";
import { RequestPayload } from "~/send/service/data/request/request.types";
import { IListPatternAction } from "~/send/types";
import { listPattern } from "../index";

const MOCK_TENANT = "xyz";
const MOCK_REQUEST_ID = "xyz";
const MOCK_FILE_PATH = "xyz";
const MOCK_SOURCE = "xyz";
const MOCK_ACTION: IListPatternAction = {
  command: "list-pattern",
  dryRunKey: undefined,
  requestId: MOCK_REQUEST_ID,
  tenantId: MOCK_TENANT,
};
const MOCK_MESSAGE: RequestV2["message"] = {
  to: {
    list_pattern: "test.*",
  },
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
const mock_requestService_create = jest.fn();

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
const mock_listService = jest.fn(async () => {
  const lists: IListItem[] = [
    {
      created: 1,
      creator: MOCK_TENANT,
      id: "test_list.alpha",
      name: "",
      updated: 1,
      updater: MOCK_TENANT,
    },
    {
      created: 1,
      creator: MOCK_TENANT,
      id: "my_test_list.beta",
      name: "",
      updated: 1,
      updater: MOCK_TENANT,
    },
    {
      created: 1,
      creator: MOCK_TENANT,
      id: "my_test_list.gamma",
      name: "",
      updated: 1,
      updater: MOCK_TENANT,
    },
  ];

  return { items: lists };
});

jest.mock("~/send/service/data/request/requests.service", () => () => ({
  create: jest.fn(() => mock_requestService_create()),
  getPayload: jest.fn(() => mock_requestService_getPayload()),
}));
jest.mock("~/send/service/actions", () => () => ({
  emit: jest.fn(() => mock_actionService()),
}));
jest.mock("~/send/service/messages", jest.fn());
jest.mock("~/lib/lists", () => {
  return {
    list: jest.fn(() => mock_listService()),
  };
});

jest.mock("~/lib/get-environment-variable");

describe("provider send handler", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call the dependent services", async () => {
    await listPattern(MOCK_ACTION);

    expect(mock_requestService_create).toHaveBeenCalledTimes(3);
    expect(mock_requestService_getPayload).toHaveBeenCalledTimes(1);
    expect(mock_actionService).toHaveBeenCalledTimes(3);
    expect(mock_listService).toHaveBeenCalledTimes(1);
  });
});
