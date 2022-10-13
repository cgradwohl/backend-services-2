import { createSimulatedEvent } from "~/lib/dynamo/event-logs";
import { mockSend } from "../mock-send";

jest.mock("~/lib/dynamo/event-logs", () => ({
  createSimulatedEvent: jest.fn(),
}));

describe("Mock send", () => {
  afterEach(jest.resetAllMocks);

  it("creates a simulated send event", async () => {
    await mockSend({
      payload: {
        command: "send",
        channel: "mockChannel",
        dryRunKey: undefined,
        tenantId: "t123",
        messageId: "m123",
        channelId: "hello",
        requestId: "r123",
        configurationId: "p123",
        contextFilePath: "filepath.json",
        outputFilePath: "filepath.json",
        messageFilePath: "shrug.json",
      },
      provider: "bluegle",
      providerConfigId: "p123",
    });

    expect(createSimulatedEvent).toHaveBeenCalledWith(
      "t123",
      "m123",
      "bluegle",
      "p123",
      {
        "message-id": "null-routed: success",
      },
      { id: undefined, label: undefined, taxonomy: undefined }
    );
  });
});
