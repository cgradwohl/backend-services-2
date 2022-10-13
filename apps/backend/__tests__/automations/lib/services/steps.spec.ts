import { deepExtend, extendStep } from "~/automations/lib/extend-step";

import { validateConditionalRefs } from "~/automations/lib/services/steps";

import { AutomationStepStatus, ISendStep, IStep } from "~/automations/types";

jest.mock("~/lib/dynamo/messages", () => ({}));
jest.mock("~/lib/message-service", () => ({}));

describe("Steps Service: validateConditionalRefs", () => {
  const tenantId = "tenantId-1";
  const runId = "runId-1";

  it("should throw a DuplicateStepRefsDefinedError if the run containes duplicate refs", () => {
    const steps: IStep[] = [
      {
        action: "send",
        created: "",
        ref: "duplicate",
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
      {
        action: "send",
        created: "",
        ref: "duplicate",
        runId,
        status: AutomationStepStatus.processing,
        stepId: "stepId-3",
        tenantId,
        updated: "",
      },
    ];

    try {
      validateConditionalRefs(steps);
    } catch (error) {
      expect(error.name).toBe("DuplicateStepRefsDefinedError");
    }
  });

  it("should return true if the run contains no refs", () => {
    const steps: IStep[] = [
      {
        action: "send",
        created: "",
        runId,
        status: AutomationStepStatus.processing,
        stepId: "stepId-1",
        tenantId,
        updated: "",
      },
    ];

    expect(validateConditionalRefs(steps)).toBe(true);
  });

  it("should throw an InvalidStepReferenceError error if the conditional contains an invalid ref", () => {
    const steps: IStep[] = [
      {
        action: "send",
        created: "",
        runId,
        ref: "test-ref",
        status: AutomationStepStatus.processing,
        stepId: "stepId-1",
        tenantId,
        updated: "",
      },
      {
        action: "send",
        if: "refs.doesNotExist",
        created: "",
        runId,
        status: AutomationStepStatus.processing,
        stepId: "stepId-1",
        tenantId,
        updated: "",
      },
    ];

    try {
      validateConditionalRefs(steps);
    } catch (error) {
      expect(error.name).toBe("InvalidStepReferenceError");
    }
  });

  it("should return true for a conditional with multiple valid refs", () => {
    const steps: IStep[] = [
      {
        action: "send",
        created: "",
        runId,
        ref: "NOT-USED",
        status: AutomationStepStatus.processing,
        stepId: "stepId-0",
        tenantId,
        updated: "",
      },
      {
        action: "send",
        created: "",
        runId,
        ref: "ref1",
        status: AutomationStepStatus.processing,
        stepId: "stepId-1",
        tenantId,
        updated: "",
      },
      {
        action: "send",
        ref: "ref2",
        created: "",
        runId,
        status: AutomationStepStatus.processing,
        stepId: "stepId-1",
        tenantId,
        updated: "",
      },
      {
        action: "send",
        ref: "ref3",
        created: "",
        runId,
        status: AutomationStepStatus.processing,
        stepId: "stepId-1",
        tenantId,
        updated: "",
      },
      {
        action: "send",
        ref: "NOT-USED2",
        if: "refs.ref1.prop && refs.ref2.prop || refs.ref3.prop",
        created: "",
        runId,
        status: AutomationStepStatus.processing,
        stepId: "stepId-1",
        tenantId,
        updated: "",
      },
    ];

    expect(validateConditionalRefs(steps)).toBe(true);
  });
});

describe("Steps Service: deepExtend", () => {
  const tenantId = "tenantId-1";
  const runId = "runId-1";

  it("should extend the property", () => {
    const rootProperty = {
      Title: "Back to the Future",
    };

    const stepProperty = {
      Character: "Marty McFly",
    };

    const extended = deepExtend(rootProperty, stepProperty);

    expect(extended.Title).toBe("Back to the Future");
    expect(extended.Character).toBe("Marty McFly");
  });

  it("should extend the property with step level precedence", () => {
    const rootProperty = {
      Title: "Back to the Future",
      data: {
        foo: "bar",
      },
    };

    const stepProperty = {
      Title: "Jurassic Park",
      data: {
        foo: "baz",
      },
    };

    const extended = deepExtend(rootProperty, stepProperty);

    expect(extended.Title).toBe("Jurassic Park");
    expect(extended.data.foo).toBe("baz");
  });

  it("should return the root level property", () => {
    const rootProperty = {
      Title: "Back to the Future",
      data: {
        foo: "bar",
      },
    };

    const stepProperty = {};

    const extended = deepExtend(rootProperty, stepProperty);

    expect(extended.Title).toBe("Back to the Future");
    expect(extended.data.foo).toBe("bar");
  });

  it("should return the step level property", () => {
    const rootProperty = {};

    const stepProperty = {
      Title: "Back to the Future",
      data: {
        foo: "bar",
      },
    };

    const extended = deepExtend(rootProperty, stepProperty);

    expect(extended.Title).toBe("Back to the Future");
    expect(extended.data.foo).toBe("bar");
  });
});

describe("Steps Service: applyContext", () => {
  it("should apply the proper contxt to the step", () => {
    const context = {
      data: {
        foo: {
          bar: "buzz",
        },
      },
      recipient: "context_recipient",
    };

    const step: ISendStep = {
      action: "send",
      brand: "test_brand",
      data: {},
      idempotency_expiry: new Date().toISOString(),
      idempotency_key: "test_key",
      override: { foo: "bar" },
      profile: { foo: "bar" },
      recipient: undefined,
      template: "test_template",
      created: "",
      updated: "",
      runId: "test_runId",
      stepId: "test_stepId",
      tenantId: "test_tenantId",
      status: AutomationStepStatus.notProcessed,
    };

    const enrichedStep = extendStep(step, context) as ISendStep;

    expect(enrichedStep.data.foo.bar).toBe("buzz");
    expect(enrichedStep.recipient).toBe("context_recipient");
  });
});
