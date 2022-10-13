import {
  ArgumentRequiredError,
  InvalidAutomationEntityError,
} from "../../types";
import { AutomationStepReference } from "../step-reference.entity";

describe("class AutomationStepReference", () => {
  test("constructor - failure", () => {
    const item = {};
    expect(() => new AutomationStepReference(item as any)).toThrow(
      ArgumentRequiredError
    );
  });

  test("constructor - success", () => {
    const item = {
      name: "mock",
      runId: "mock",
      stepId: "mock",
      tenantId: "mock",
    };

    const ref = new AutomationStepReference(item);
    expect(ref.created).toBeDefined();
    expect(ref.updated).toBeDefined();
    expect(ref.___type___).toBe("step-reference");
    expect(ref.runId).toBe("mock");
    expect(ref.stepId).toBe("mock");
    expect(ref.tenantId).toBe("mock");
  });

  test("fromItem - failure", () => {
    const Item = {
      name: "mock",
      runId: "mock",
      stepId: "mock",
      tenantId: "mock",
    };

    expect(() => AutomationStepReference.fromItem(Item)).toThrow(
      InvalidAutomationEntityError
    );
  });

  test("fromItem - success", () => {
    const Item = {
      created: "mock",
      name: "mock",
      runId: "mock",
      stepId: "mock",
      tenantId: "mock",
      updated: "mock",
    };

    expect(() => AutomationStepReference.fromItem(Item)).not.toThrow(
      InvalidAutomationEntityError
    );
    const ref = AutomationStepReference.fromItem(Item);
    expect(ref.created).toBeDefined();
    expect(ref.updated).toBeDefined();
    expect(ref.___type___).toBe("step-reference");
    expect(ref.runId).toBe("mock");
    expect(ref.stepId).toBe("mock");
    expect(ref.tenantId).toBe("mock");
  });
  test("toItem", () => {
    const ref = new AutomationStepReference({
      name: "mock_name",
      runId: "mock_run",
      stepId: "mock_step",
      tenantId: "mock_tenant",
    });

    const item = ref.toItem();
    expect(item.pk).toBe("mock_run/mock_name");
    expect(item.sk).toBe("mock_run/mock_name");
    expect(item.runId).toBe("mock_run");
    expect(item.stepId).toBe("mock_step");
    expect(item.tenantId).toBe("mock_tenant");
    expect(item.___type___).toBe("step-reference");
  });

  test("key", () => {
    const { pk, sk } = AutomationStepReference.key({
      name: "mock_name",
      runId: "mock_run",
    });

    expect(pk).toBe("mock_run/mock_name");
    expect(sk).toBe("mock_run/mock_name");
  });
});
