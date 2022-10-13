import { Message } from "~/api/send/types";
import { getUserRouting } from "../get-custom-routing-strategy";
import { getRoutingTree, GetRoutingTreeOpts } from "../get-routing";
import { mockProviderConfigs } from "../__mocks__/provider-configs";

jest.mock("../get-custom-routing-strategy");
jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");

describe("get routing tree", () => {
  beforeEach(jest.clearAllMocks);

  const baseMessage: Message = {
    content: { body: "hello" },
    to: {},
  };

  const baseOpts: GetRoutingTreeOpts = {
    message: baseMessage,
    tenantId: "tenant-id",
    profile: {},
    providerConfigs: mockProviderConfigs,
    strategy: {
      routing: { method: "all", channels: ["sms"] },
      channels: {},
      providers: {},
    },
    variableData: {
      profile: {},
      data: {},
    } as any,
  };

  it("calls getUserRouting", async () => {
    expect.assertions(1);
    await getRoutingTree(baseOpts);
    expect(getUserRouting).toHaveBeenCalled();
  });

  it("returns the standard supplied strategy when routing tree is not enabled", async () => {
    expect.assertions(1);
    const routing = await getRoutingTree(baseOpts);
    expect((routing as any).strategy).toMatchObject(baseOpts.strategy);
  });

  it("returns empty object when routing tree is not enabled, template is passed, and no message.routing is provided", async () => {
    expect.assertions(1);
    const routing = await getRoutingTree({
      ...baseOpts,
      message: { template: "", to: {} },
      templateV1: {} as any,
    });
    expect(routing).toMatchObject({});
  });

  it("returns a routing tree when enabled for tenant", async () => {
    expect.assertions(1);
    const routing = await getRoutingTree({
      ...baseOpts,
      tenantId: "038ba22e-e641-4a56-a1bf-463c81c65ef2",
    });
    expect(routing).toMatchSnapshot();
  });
});
