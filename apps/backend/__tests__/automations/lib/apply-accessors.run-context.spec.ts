import { applyAccessors } from "~/automations/lib/apply-accessors";
import { Step } from "~/automations/types";

jest.mock("~/lib/dynamo/messages", () => ({}));
jest.mock("~/lib/message-service", () => ({}));
jest.mock("~/lib/dynamo", () => ({
  getItem: jest.fn(() => ({ Item: {} })),
}));

jest.mock("~/automations/lib/services/steps-reference", () => () => ({
  get: jest.fn(() => null),
}));

describe("Apply Run Context to Step", () => {
  const step = {} as Step;
  const runContext = {
    data: {
      market: {
        region: {
          global: "5000",
          local: "3000",
        },
      },
    },
    profile: {
      recipient: "abc",
    },
    template: "foobar",
  };

  it("should return null if the accessor path root is invalid", async () => {
    const jsonStep = {
      action: "send",
      recipient: {
        $ref: "profile.recipient",
      },
      template: {
        $ref: "template",
      },
      profile: {
        $ref: "I.do.not.exists",
      },
    };

    const appliedStep: any = await applyAccessors(jsonStep, runContext, step);

    expect(appliedStep.profile).toBeNull();
    expect(appliedStep.recipient).toBe("abc");

    expect(appliedStep.template).toBe("foobar");
  });

  it("should return null if an accessor path child is invalid", async () => {
    const jsonStep = {
      action: "send",
      recipient: {
        $ref: "profile.recipient",
      },
      template: {
        $ref: "template",
      },
      profile: {
        $ref: "profile.does.not.exists",
      },
    };

    const appliedStep: any = await applyAccessors(jsonStep, runContext, step);

    expect(appliedStep.profile).toBeNull();
    expect(appliedStep.recipient).toBe("abc");

    expect(appliedStep.template).toBe("foobar");
  });

  it("should return the value from run context if the path is valid", async () => {
    const jsonStep = {
      action: "send",
      recipient: {
        $ref: "profile.recipient",
      },
      template: {
        $ref: "template",
      },
      profile: {
        $ref: "profile.recipient",
      },
    };

    const appliedStep: any = await applyAccessors(jsonStep, runContext, step);

    expect(appliedStep.profile).toBe("abc");
    expect(appliedStep.recipient).toBe("abc");

    expect(appliedStep.template).toBe("foobar");
  });

  it("should return the value from run context if the path is a string", async () => {
    const jsonStep = {
      action: "send",
      recipient: {
        $ref: "profile.recipient",
      },
      template: {
        $ref: "template",
      },
      profile: {
        $ref: "profile.recipient",
      },
    };

    const appliedStep: any = await applyAccessors(jsonStep, runContext, step);

    expect(appliedStep.template).toBe("foobar");
    expect(appliedStep.recipient).toBe("abc");
  });

  it("should return null if the path is an invalid string", async () => {
    const jsonStep = {
      action: "send",
      recipient: {
        $ref: "profile.recipient",
      },
      template: {
        $ref: "I.do.not.exist",
      },
      profile: {
        $ref: "profile.recipient",
      },
    };

    const appliedStep: any = await applyAccessors(jsonStep, runContext, step);

    expect(appliedStep.template).toBeNull();
    expect(appliedStep.recipient).toBe("abc");
  });

  it("should return the value from a deeply nested run context property", async () => {
    const jsonStep = {
      action: "send",
      recipient: {
        $ref: "profile.recipient",
      },
      template: {
        $ref: "data.market.region.global",
      },
      profile: {
        $ref: "profile.recipient",
      },
    };

    const appliedStep: any = await applyAccessors(jsonStep, runContext, step);

    expect(appliedStep.template).toBe("5000");
    expect(appliedStep.recipient).toBe("abc");
  });

  it("should return the value from a deeply nested run context property into a deeply nested step property", async () => {
    const jsonStep = {
      action: "send",
      recipient: {
        $ref: "profile.recipient",
      },
      template: {
        $ref: "template",
      },
      profile: {
        $ref: "profile.recipient",
      },
      data: {
        foo: {
          bar: {
            baz: {
              $ref: "data.market.region.global",
            },
          },
        },
      },
    };

    const appliedStep: any = await applyAccessors(jsonStep, runContext, step);

    expect(appliedStep.data.foo.bar.baz).toBe("5000");
    expect(appliedStep.template).toBe("foobar");
    expect(appliedStep.recipient).toBe("abc");
  });

  it("should return null from an invalid deeply nested run context property, into a deeply nested step property", async () => {
    const jsonStep = {
      action: "send",
      recipient: {
        $ref: "profile.recipient",
      },
      template: {
        $ref: "template",
      },
      profile: {
        $ref: "profile.recipient",
      },
      data: {
        foo: {
          bar: {
            baz: {
              $ref: "data.market.I.DO.NOT.EXIST.global",
            },
          },
        },
      },
    };

    const appliedStep: any = await applyAccessors(jsonStep, runContext, step);

    expect(appliedStep.data.foo.bar.baz).toBeNull();
    expect(appliedStep.template).toBe("foobar");
    expect(appliedStep.recipient).toBe("abc");
  });

  it("should return null if the step property value is null", async () => {
    const jsonStep = {
      action: "send",
      prevStepId: null,
      recipient: {
        $ref: "profile.recipient",
      },
      template: {
        $ref: "template",
      },
      profile: {
        $ref: "profile.recipient",
      },
      data: {
        foo: {
          bar: {
            baz: {
              $ref: "data.market.I.DO.NOT.EXIST.global",
            },
          },
        },
      },
    };

    const appliedStep: any = await applyAccessors(jsonStep, runContext, step);

    expect(appliedStep.prevStepId).toBeNull();
    expect(appliedStep.data.foo.bar.baz).toBeNull();
    expect(appliedStep.template).toBe("foobar");
    expect(appliedStep.recipient).toBe("abc");
  });
});
