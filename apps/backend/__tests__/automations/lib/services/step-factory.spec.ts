import stepFactory from "~/automations/lib/services/step-factory";
import { ISendStep } from "~/automations/types";

const tenantId = "test_tenantId";
const runId = "test_runId";
const factory = stepFactory(tenantId);

describe("steps service: step-factory", () => {
  it("should return a valid executable send step, given an inbound send step", () => {
    const step = {
      action: "send",
      brand: "test_brand",
      data: { foo: "bar" },
      idempotency_expiry: 123,
      idempotency_key: "test_key",
      override: { foo: "bar" },
      profile: { foo: "bar" },
      recipient: "test_recipient",
      template: "test_template",
    };

    const factoryStep = factory.create(runId, step) as ISendStep;

    expect(factoryStep.action).toBe(step.action);
    expect(factoryStep.brand).toBe(step.brand);
    expect(factoryStep.data).toBe(step.data);
    expect(factoryStep.idempotency_expiry).toBe(step.idempotency_expiry);
    expect(factoryStep.idempotency_key).toBe(step.idempotency_key);
    expect(factoryStep.override).toBe(step.override);
    expect(factoryStep.profile).toBe(step.profile);
    expect(factoryStep.recipient).toBe(step.recipient);
    expect(factoryStep.template).toBe(step.template);

    // added properties from factory
    expect(factoryStep.created).toBeDefined();
    expect(factoryStep.context).toBeDefined();
    expect(factoryStep.runId).toBeDefined();
    expect(factoryStep.stepId).toBeDefined();
    expect(factoryStep.status).toBeDefined();
    expect(factoryStep.tenantId).toBeDefined();
    expect(factoryStep.updated).toBeDefined();
  });
});
