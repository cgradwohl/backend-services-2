import { dispatchRouteSummaryToRenderService } from "..";
import { IRoutingSummary } from "../../types";

jest.mock("~/send/service", () => ({
  renderService: () => ({
    emit: (...args: any[]) => mockEmit(...args),
  }),
}));
const mockEmit = jest.fn((..._args: any[]) => Promise.resolve());

describe("dispatchRoutesToRenderService", () => {
  it("should dispatch correct routes", async () => {
    const summary: Partial<IRoutingSummary>[] = [
      {
        id: "channel-1",
        selected: true,
        configurationId: "provider-1",
      },
      {
        id: "channel-2",
        selected: false,
        configurationId: "provider-2",
      },
      {
        id: "channel-3",
        selected: true,
        configurationId: "provider-3",
      },
    ];

    await dispatchRouteSummaryToRenderService({
      contextFilePath: "context-file-path",
      dryRunKey: undefined,
      messageFilePath: "message-file-path",
      messageId: "message-id",
      requestId: "request-id",
      routingSummary: summary,
      tenantId: "tenant-id",
      translated: false,
    });

    expect(mockEmit).toHaveBeenCalledTimes(2);
    expect(mockEmit).toHaveBeenNthCalledWith(1, {
      channelId: "channel-1",
      channel: undefined,
      command: "render",
      dryRunKey: undefined,
      contextFilePath: "context-file-path",
      messageId: "message-id",
      messageFilePath: "message-file-path",
      configurationId: "provider-1",
      requestId: "request-id",
      tenantId: "tenant-id",
      shouldVerifyRequestTranslation: false,
      translated: false,
    });
    expect(mockEmit).toHaveBeenNthCalledWith(2, {
      channelId: "channel-3",
      contextFilePath: "context-file-path",
      channel: undefined,
      command: "render",
      dryRunKey: undefined,
      messageId: "message-id",
      messageFilePath: "message-file-path",
      configurationId: "provider-3",
      requestId: "request-id",
      tenantId: "tenant-id",
      shouldVerifyRequestTranslation: false,
      translated: false,
    });
  });
});
