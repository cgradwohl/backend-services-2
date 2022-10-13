import { complexSmsAndEmailTree } from "~/lib/send-routing/__mocks__/trees";
import { getAllRouteLeafs, setSendTimesForLeafs } from "~/lib/send-routing";
import { dispatchRouteTreeToRenderService } from "../dispatch-route-tree-to-render";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/send-routing");
jest.mock("~/send/service", () => ({
  renderService: () => ({
    emit: (...args: any[]) => mockEmit(...args),
  }),
}));
jest.mock("~/lib/sentry");
const mockEmit = jest.fn((..._args: any[]) => Promise.resolve());
const mockSetSendTimesForLeafs = setSendTimesForLeafs as jest.Mock;
const mockGetAllRouteLeafs = getAllRouteLeafs as jest.Mock;

describe("dispatchRouteTreeToRender", () => {
  beforeEach(jest.clearAllMocks);

  it("should dispatch correct routes", async () => {
    expect.assertions(3);

    mockSetSendTimesForLeafs.mockReturnValue({});
    mockGetAllRouteLeafs.mockReturnValue([
      {
        channel: "sms",
        provider: "twilio",
        providerConfigurationId: "7593c6b6-f241-47f0-85b4-b5386cd60086",
        taxonomy: "direct_message:sms:twilio",
        address: [0, 0],
        providerFailoverIndex: 1,
        type: "leaf",
      },
    ]);

    await dispatchRouteTreeToRenderService({
      contextFilePath: "context-file-path",
      dryRunKey: undefined,
      messageFilePath: "message-file-path",
      messageId: "message-id",
      requestId: "request-id",
      routingTree: complexSmsAndEmailTree,
      tenantId: "tenant-id",
    });

    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockSetSendTimesForLeafs).toHaveBeenCalled();
    expect(mockEmit).toHaveBeenNthCalledWith(1, {
      command: "render",
      contextFilePath: "context-file-path",
      messageId: "message-id",
      messageFilePath: "message-file-path",
      configurationId: "7593c6b6-f241-47f0-85b4-b5386cd60086",
      requestId: "request-id",
      shouldVerifyRequestTranslation: false,
      translated: false,
      tenantId: "tenant-id",
      address: [0, 0],
      times: {},
      channel: "sms",
      channelId: undefined,
      dryRunKey: undefined,
    });
  });
});
