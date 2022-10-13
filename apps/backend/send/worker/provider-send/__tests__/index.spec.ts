import contextService from "~/send/service/context";
import sendHandlers from "~/providers/send-handlers";
import { handler } from "../index";
import { mockSend } from "../mock-send";
import { ISendProviderPayload } from "~/send/types";
import {
  createProviderAttemptEvent,
  createSentEvent,
} from "~/lib/dynamo/event-logs";
import { getRenderedOutput } from "~/send/service/rendered-output";
import * as configService from "~/lib/configurations-service";

jest.mock("../handle-send-error", () => ({ handleSendError: jest.fn() }));

jest.mock("~/send/service/rendered-output", () => ({
  getRenderedOutput: jest.fn(),
}));
jest.mock("~/providers/send-handlers", () => ({
  test: jest.fn(),
}));
jest.mock("~/lib/variable-handler", () => jest.fn());
jest.mock("../mock-send", () => ({ mockSend: jest.fn() }));
jest.mock("~/lib/dynamo/event-logs", () => ({
  createProviderAttemptEvent: jest.fn(),
  createSentEvent: jest.fn(),
}));
jest.mock("~/lib/kinesis/create-event-handler", () => ({
  createEventHandlerWithFailures: jest.fn(),
}));
jest.mock("~/send/service/context");

const mockGetConfiguration = jest.spyOn(configService, "get"); // spy on foo
mockGetConfiguration.mockImplementation(async () => ({
  updater: "Google_116536091822753266253",
  updated: 1636502815774,
  creator: "Google_116536091822753266253",
  tenantId: "56f10a9f-4d79-458f-83e1-6d14a8822299",
  created: 1636502815774,
  json: {
    provider: "test",
    apiKey: "fadsasdfasdf",
    fromAddress: "dexter@dexterlab.com",
  },
  objtype: "configuration",
  id: "p123",
  title: "Default Configuration",
}));

const mockGetRenderedOutput = getRenderedOutput as jest.Mock;
const mockContextGet = contextService("bleh").get as jest.Mock;
const sendHandler = sendHandlers.test as unknown as jest.Mock;
const mockMockSend = mockSend as jest.Mock;
const mockCreateSentEvent = createSentEvent as jest.Mock;
const mockCreateProviderAttemptEvent = createProviderAttemptEvent as jest.Mock;

const exampleRenderedMessage = {
  provider: {
    id: "p123",
    json: {
      provider: "test",
    },
  },
  deliveryHandlerParams: {
    channel: {
      id: "mock_channel_id",
      label: "mock_channel_label",
      taxonomy: "mock_channel_taxonmoy",
    },
  },
  templates: {},
};

const examplePayload: ISendProviderPayload = {
  command: "send",
  channel: "mockChannel",
  tenantId: "t123",
  messageId: "m123",
  channelId: "c123",
  dryRunKey: undefined,
  configurationId: "p123",
  requestId: "r123",
  contextFilePath: "filepath.json",
  outputFilePath: "filepath.json",
  messageFilePath: "shrug.json",
};

const mockContext = {
  providers: [
    {
      updater: "Google_116536091822753266253",
      updated: 1636502815774,
      creator: "Google_116536091822753266253",
      tenantId: "56f10a9f-4d79-458f-83e1-6d14a8822299",
      created: 1636502815774,
      json: {
        provider: "test",
        apiKey: "fadsasdfasdf",
        fromAddress: "dexter@dexterlab.com",
      },
      objtype: "configuration",
      id: "p123",
      title: "Default Configuration",
    },
  ],
};

describe("provider send handler", () => {
  beforeAll(() => jest.clearAllMocks());

  it("runs a mock send when given dryRunKey", async () => {
    mockGetRenderedOutput.mockResolvedValue(exampleRenderedMessage);
    mockContextGet.mockResolvedValue(mockContext);
    await handler({
      ...examplePayload,
      dryRunKey: "mock",
    });
    expect(mockMockSend).toHaveBeenCalled();
    expect(sendHandler).toHaveBeenCalledTimes(0);
  });

  it("handles a provider send event", async () => {
    mockGetRenderedOutput.mockResolvedValue(exampleRenderedMessage);
    mockContextGet.mockResolvedValue(mockContext);
    await handler(examplePayload);
    expect(mockCreateSentEvent).toHaveBeenCalled();
    expect(mockCreateProviderAttemptEvent).toHaveBeenCalled();
  });
});
