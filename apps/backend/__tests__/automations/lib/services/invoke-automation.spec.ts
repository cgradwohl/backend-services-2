import { invokeAutomation } from "~/automations/lib/invoke-automation";
import { AutomationInvokeDefinitionError } from "~/automations/lib/errors";
import { AutomationStepStatus } from "~/automations/types";

var spy = jest.fn((key, json) => {});
jest.mock("~/lib/s3", () => () => ({
  put: jest.fn((key, json) => spy(key, json)),
}));

//Mocking the steps service to be empty since it unneccesarily
//tries to call sentry, which gives environment variable errors
jest.mock("~/automations/lib/services/steps", () => () => {});

describe("Invoke Automations", () => {
  it("should throw AutomationInvokeDefinitionError if automation is invalid.", async () => {
    await expect(async () => {
      await invokeAutomation({
        steps: undefined,
        context: undefined,
        runId: undefined,
        scope: undefined,
        source: undefined,
        tenantId: undefined,
      });
    }).rejects.toThrow(AutomationInvokeDefinitionError);
  });

  it("should enter a new automation run into S3", async () => {
    const tenantId = "tenantId-1";
    const runId = "runId-1";
    const cancelation_token = "cancelationToken-1";
    const scope = "draft/test";
    const source = [""];
    const context = {};
    const steps: any[] = [
      {
        action: "send",
        created: "",
        ref: "ref-1",
        runId,
        status: AutomationStepStatus.processing,
        stepId: "stepId-1",
        tenantId,
        updated: "",
      },
      {
        action: "send",
        created: "",
        runId,
        status: AutomationStepStatus.processing,
        stepId: "stepId-2",
        tenantId,
        updated: "",
      },
    ];
    await invokeAutomation({
      cancelation_token,
      steps,
      context,
      runId,
      scope,
      source,
      tenantId,
    });

    expect(spy.mock.calls.length).toBe(2); // Two calls since updates made to two stores
    expect(spy.mock.calls[1][0]).toBe("tenantId-1/runId-1.json");
    expect(spy.mock.calls[1][1].type).toBe("automation-run");
  });
});
