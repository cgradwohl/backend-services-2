import { AutomationStepStatus, ISendStepV2 } from "~/automations/types";
import { extendV2SendStep } from "../extend-step";

describe("extend v2 send step", () => {
  it("should return the message object, given empty context", () => {
    const step: ISendStepV2 = {
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    };

    const context = {};

    const result = extendV2SendStep(step, context);
    expect(result).toStrictEqual(step);
  });

  it("should extend the context recipient into the message", () => {
    const step: ISendStepV2 = {
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    };

    const context = {
      recipient: "foo",
    };

    const result = extendV2SendStep(step, context);
    expect(result).toStrictEqual({
      action: "send",
      message: {
        to: {
          email: "foo",
          user_id: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    });
  });

  it("should extend the context brand into the message", () => {
    const step: ISendStepV2 = {
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    };

    const context = {
      brand: "foo",
    };

    const result = extendV2SendStep(step, context);
    expect(result).toStrictEqual({
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
        brand_id: "foo",
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    });
  });

  it("should extend the context data into the message", () => {
    const step: ISendStepV2 = {
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    };

    const context = {
      data: {
        foo: "bar",
      },
    };

    const result = extendV2SendStep(step, context);
    expect(result).toStrictEqual({
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
        data: {
          foo: "bar",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    });
  });

  it("should extend the context data with the message", () => {
    const step: ISendStepV2 = {
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
        data: {
          bar: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    };

    const context = {
      data: {
        foo: "bar",
      },
    };

    const result = extendV2SendStep(step, context);
    expect(result).toStrictEqual({
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
        data: {
          foo: "bar",
          bar: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    });
  });

  it("should extend the context template into the message", () => {
    const step: ISendStepV2 = {
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    };

    const context = {
      template: "bar",
    };

    const result = extendV2SendStep(step, context);
    expect(result).toStrictEqual({
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
        template: "bar",
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    });
  });

  it("should extend the context profile into the message", () => {
    const step: ISendStepV2 = {
      action: "send",
      message: {
        to: {
          email: "foo",
        },
        content: {
          title: "foo",
          body: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    };

    const context = {
      profile: {
        foo: "bar",
      },
    };

    const result = extendV2SendStep(step, context);
    expect(result).toStrictEqual({
      action: "send",
      message: {
        to: {
          email: "foo",
          foo: "bar",
        },
        content: {
          title: "foo",
          body: "foo",
        },
      },
      created: "",
      runId: "",
      stepId: "",
      status: AutomationStepStatus.processing,
      tenantId: "",
      updated: "",
    });
  });
});
