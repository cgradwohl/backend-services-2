import { DynamoDBRecord } from "aws-lambda";
import * as courier from "~/lib/courier";
import { gracePeriodDynamoHandler } from "~/triggers/kinesis/tenants/grace-period";

jest.mock("~/lib/tenant-service", () => ({
  update: jest.fn(),
}));

jest.mock("~/lib/kinesis/create-event-handler", () => ({
  createEventHandlerWithFailures: jest.fn(),
}));

jest.mock("~/lib/tenant-access-rights-service", () => ({
  listAccessRights: jest.fn(),
}));

jest.mock("~/lib/dynamo/to-json", () =>
  jest.fn().mockImplementation((obj) => obj)
);

jest.mock("~/lib/tenant-access-rights-service", () => ({
  listAccessRights: jest.fn().mockReturnValue([{ userId: "test-user" }]),
}));

jest.spyOn(courier, "default").mockReturnValue(<any>{
  send: jest.fn().mockReturnValue(Promise.resolve()),
  automations: {
    invokeAutomationTemplate: jest.fn().mockReturnValue(Promise.resolve()),
  },
});
const sendMock = jest.spyOn(courier.default(), "send");
const automationMock = jest.spyOn(
  courier.default().automations,
  "invokeAutomationTemplate"
);

const createDynamoRecord = (usage: number, plan: string): DynamoDBRecord => {
  return {
    dynamodb: {
      NewImage: <any>{
        stripeCurrentPeriodEnd: "",
        tenantId: "some-tenant",
        usageCurrentPeriod: usage,
        name: "",
        pricingPlan: plan,
      },
      OldImage: <any>{
        usageCurrentPeriod: 7000,
      },
    },
  };
};

describe("grace period dynamo handler", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not send any notification if usage is unchanged", async () => {
    await gracePeriodDynamoHandler(createDynamoRecord(7000, "good"));
    expect(sendMock).not.toHaveBeenCalled();
    expect(automationMock).not.toHaveBeenCalled();
  });
  it("should not send any notification for non-free plans", async () => {
    await gracePeriodDynamoHandler(createDynamoRecord(7001, "better"));
    expect(sendMock).not.toHaveBeenCalled();
    expect(automationMock).not.toHaveBeenCalled();
  });

  describe("when handling free tier notifications", () => {
    it("should send a notification when usage has exceeded 80% of limit", async () => {
      await gracePeriodDynamoHandler(createDynamoRecord(8001, "good"));
      expect(sendMock).toHaveBeenCalled();
    });

    it("should not send a notification when usage has not exceeded 80% of limit", async () => {
      await gracePeriodDynamoHandler(createDynamoRecord(7500, "good"));
      expect(sendMock).not.toHaveBeenCalled();
    });
  });
});
