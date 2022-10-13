import {
  ArgumentRequiredError,
  InvalidAutomationEntityError,
} from "../../types";
import { AutomationStep } from "../step.entity";
import { StepAction, StepStatus } from "../step.types";

jest.mock("~/lib/get-hash-from-range", () => {
  return { getHashFromRange: () => 2 };
});

describe("class AutomationStep", () => {
  test("constructor - failure", () => {
    const item = {};
    expect(() => new AutomationStep(item as any)).toThrow(
      ArgumentRequiredError
    );
  });
  test("constructor - success", () => {
    const item = {
      action: StepAction.Send,
      ref: "mock",
      runId: "mock",
      stepId: "mock",
      status: StepStatus.Processed,
      tenantId: "mock",
    };

    const step = new AutomationStep(item);
    expect(step.nextStepId).not.toBeDefined();
    expect(step.prevStepId).not.toBeDefined();
    expect(step.created).toBeDefined();
    expect(step.updated).toBeDefined();
    expect(step.shard).toBe(2);
    expect(step.___type___).toBe("step");
  });

  test("fromItem - failure", () => {
    const Item = {
      action: StepAction.Send,
      ref: "mock",
      runId: "mock",
      stepId: "mock",
      status: StepStatus.Processed,
      tenantId: "mock",
    };

    expect(() => AutomationStep.fromItem(Item)).toThrow(
      InvalidAutomationEntityError
    );
  });

  test("fromItem - success", () => {
    const Item = {
      action: StepAction.Send,
      created: "mock",
      ref: "mock",
      runId: "mock",
      shard: 7,
      stepId: "mock",
      status: StepStatus.Processed,
      tenantId: "mock",
      updated: "mock",
    };

    expect(() => AutomationStep.fromItem(Item)).not.toThrow();
    const step = AutomationStep.fromItem(Item);
    expect(step.nextStepId).not.toBeDefined();
    expect(step.prevStepId).not.toBeDefined();
    expect(step.created).toBeDefined();
    expect(step.updated).toBeDefined();
    expect(step.shard).toBe(7);
    expect(step.___type___).toBe("step");
  });

  test("toItem", () => {
    const step = new AutomationStep({
      action: StepAction.Send,
      ref: "mock",
      runId: "mock",
      stepId: "mock",
      status: StepStatus.Processed,
      tenantId: "mock",
    });

    const item = step.toItem();
    expect(item.pk).toBe("mock");
    expect(item.sk).toBe("mock/step/mock");
    expect(step.shard).toBe(2);
    expect(step.tenantId).toBe("mock");
    expect(step.___type___).toBe("step");
  });

  test("key", () => {
    const { pk, sk } = AutomationStep.key({
      runId: "mock_run",
      stepId: "mock_step",
    });

    expect(pk).toBe("mock_run");
    expect(sk).toBe("mock_run/step/mock_step");
  });
});
