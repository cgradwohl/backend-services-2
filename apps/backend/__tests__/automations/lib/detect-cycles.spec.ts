import { detectCycles } from "~/automations/lib/detect-cycles";
import { AutomationInvokeCycleError } from "~/automations/lib/errors";
import {
  AutomationStepStatus,
  IInvokeStep,
  ISendStep,
} from "~/automations/types";

describe("Detect Cycles in Automation", () => {
  it("should return undefined if steps does not contain an invoke step", () => {
    const source = [];
    const sendStep: ISendStep = {
      action: "send",
      created: "",
      runId: "123",
      recipient: "abc",
      status: AutomationStepStatus.processing,
      stepId: "stepId-1",
      template: "abc",
      tenantId: "123",
      updated: "",
    };
    const steps = [sendStep];

    try {
      const result = detectCycles(source, steps);

      expect(result).toBeUndefined();
    } catch (error) {
      expect(error).toBeUndefined();
    }
  });

  it("should return undefined if execution graph does not contain a cycle", () => {
    const source = ["invoke", "invoke/templateA"];
    const sendStep: ISendStep = {
      action: "send",
      created: "",
      runId: "123",
      recipient: "abc",
      status: AutomationStepStatus.processing,
      stepId: "stepId-1",
      template: "abc",
      tenantId: "123",
      updated: "",
    };

    const invokeStep: IInvokeStep = {
      action: "invoke",
      template: "templateB",
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "123",
      updated: "",
    };

    const steps = [sendStep, invokeStep];

    try {
      const result = detectCycles(source, steps);

      expect(result).toBeUndefined();
    } catch (error) {
      expect(error).toBeUndefined();
    }
  });

  it("should throw cyce error if a 1 node cycle exists", () => {
    const source = ["invoke/templateA"];
    const sendStep: ISendStep = {
      action: "send",
      created: "",
      runId: "123",
      recipient: "abc",
      status: AutomationStepStatus.processing,
      stepId: "stepId-1",
      template: "abc",
      tenantId: "123",
      updated: "",
    };

    const invokeStep: IInvokeStep = {
      action: "invoke",
      template: "templateA",
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "123",
      updated: "",
    };
    const steps = [sendStep, invokeStep];

    try {
      detectCycles(source, steps);
    } catch (error) {
      expect(error).toBeInstanceOf(AutomationInvokeCycleError);
    }
  });

  it("should throw cycle error if a cycle exists in a multi-node graph", () => {
    const source = [
      "invoke",
      "invoke/templateA",
      "invoke/templateB",
      "invoke/templateC",
      "invoke/templateD",
    ];
    const sendStep: ISendStep = {
      action: "send",
      created: "",
      runId: "123",
      recipient: "abc",
      status: AutomationStepStatus.processing,
      stepId: "stepId-1",
      template: "abc",
      tenantId: "123",
      updated: "",
    };

    const invokeStep: IInvokeStep = {
      action: "invoke",
      template: "templateD",
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "123",
      updated: "",
    };
    const steps = [sendStep, invokeStep];

    try {
      detectCycles(source, steps);
    } catch (error) {
      expect(error).toBeInstanceOf(AutomationInvokeCycleError);
    }
  });

  it("should throw cycle error if a PRIOR cycle exists in a multi-node graph", () => {
    const source = [
      "invoke",
      "invoke/templateA",
      "invoke/templateB",
      "invoke/templateC",
      "invoke/templateD",
    ];
    const sendStep: ISendStep = {
      action: "send",
      created: "",
      runId: "123",
      recipient: "abc",
      status: AutomationStepStatus.processing,
      stepId: "stepId-1",
      template: "abc",
      tenantId: "123",
      updated: "",
    };

    const invokeStep: IInvokeStep = {
      action: "invoke",
      template: "templateB",
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "123",
      updated: "",
    };
    const steps = [sendStep, invokeStep];

    try {
      detectCycles(source, steps);
    } catch (error) {
      expect(error).toBeInstanceOf(AutomationInvokeCycleError);
    }
  });

  it("should throw cycle error if multiple cycles exists in a multi-node graph", () => {
    const source = [
      "invoke",
      "invoke/templateA",
      "invoke/templateB",
      "invoke/templateC",
      "invoke/templateD",
    ];
    const sendStep: ISendStep = {
      action: "send",
      created: "",
      runId: "123",
      recipient: "abc",
      status: AutomationStepStatus.processing,
      stepId: "stepId-1",
      template: "abc",
      tenantId: "123",
      updated: "",
    };

    const invokeStep1: IInvokeStep = {
      action: "invoke",
      template: "templateB",
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "123",
      updated: "",
    };

    const invokeStep2: IInvokeStep = {
      action: "invoke",
      template: "templateC",
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "123",
      updated: "",
    };
    const steps = [invokeStep2, sendStep, invokeStep1];

    try {
      detectCycles(source, steps);
    } catch (error) {
      expect(error).toBeInstanceOf(AutomationInvokeCycleError);
    }
  });
});
