import actionService from "~/send/service/actions";
import { failover } from "../failover";

jest.mock("~/send/service/actions");
jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");
const mockActionService = actionService as jest.Mock;

describe("failover", () => {
  beforeEach(jest.clearAllMocks);

  const baseOpts = {
    messageId: "dfjlksdjf",
    requestId: "dfjlksdjf",
    contextFilePath: "here",
    messageFilePath: "there",
    tenantId: "me",
  };

  it("should not failover if not on custom pricing plan", async () => {
    expect.assertions(1);
    await failover({
      ...baseOpts,
      address: [0],
      pricingPlan: "better",
      times: {} as any,
    });
    expect(mockActionService).not.toHaveBeenCalled();
  });

  it("should not failover if no address or times is specified", async () => {
    expect.assertions(1);
    await failover({
      ...baseOpts,
      pricingPlan: "custom",
    });
    expect(mockActionService).not.toHaveBeenCalled();
  });

  it("should failover if all requirements are met", async () => {
    expect.assertions(1);
    await failover({
      ...baseOpts,
      address: [0],
      pricingPlan: "custom",
      times: {} as any,
    });
    expect(mockActionService).toHaveBeenCalled();
  });
});
