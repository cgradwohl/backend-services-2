import SendRoutingStrategyDataSource from "../data-source";

const mockGetSendRouting = jest.fn();
const mockPutSendRouting = jest.fn();
jest.mock("~/lib/send-routing", () => ({
  getSendRoutingStrategy: (...args) => mockGetSendRouting(...args),
  putSendRoutingStrategy: (...args) => mockPutSendRouting(...args),
}));

describe("gql send routing data source", () => {
  beforeEach(jest.resetAllMocks);

  it("sets a send routing strategy", async () => {
    const sendRouting = new SendRoutingStrategyDataSource();
    const tenantId = "123";
    sendRouting.initialize({ context: { tenantId } } as any);
    const strategy = {
      routing: "{}",
      channels: "{}",
      providers: "{}",
    };
    await sendRouting.set(strategy);
    expect(mockPutSendRouting).toHaveBeenCalledWith({
      tenantId,
      strategy: {
        routing: {},
        channels: {},
        providers: {},
      },
    });
  });

  it("gets a send routing strategy", async () => {
    const sendRouting = new SendRoutingStrategyDataSource();
    const tenantId = "123";
    sendRouting.initialize({ context: { tenantId } } as any);
    mockGetSendRouting.mockResolvedValue({
      routing: {},
      channels: {},
      providers: {},
    });
    expect(await sendRouting.get()).toEqual({
      routing: "{}",
      channels: "{}",
      providers: "{}",
    });
    expect(mockGetSendRouting).toHaveBeenCalledWith({ tenantId });
  });
});
