import stepReference from "~/automations/lib/services/steps-reference";
import { AutomationStepStatus, IStep } from "~/automations/types";
import { update } from "~/lib/dynamo";

// this is imported by stepReference
// use this import instead in this closure
const mockUpdate = jest.fn();
jest.mock("~/automations/lib/stores/dynamo", () => ({
  update: jest.fn((param) => mockUpdate(param)),
}));

describe("Step Reference Service", () => {
  const tenantId = "tenantId-1";
  const runId = "runId-1";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new ref for each ref'd step", async () => {
    const steps: IStep[] = [
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
      {
        action: "send",
        created: "",
        ref: "ref-3",
        runId,
        status: AutomationStepStatus.processing,
        stepId: "stepId-3",
        tenantId,
        updated: "",
      },
    ];

    const refs = stepReference(tenantId);
    await refs.createRefs(steps);

    const expectedRefs = steps.filter((s) => s.ref);

    const actualRefs = mockUpdate.mock.calls
      .map((callArray) => callArray[0])
      .map((call) => call.ExpressionAttributeValues)
      .map((values) => ({
        name: values[":name"],
        runId: values[":runId"],
        stepId: values[":stepId"],
        tenantId: values[":tenantId"],
      }));

    expect(actualRefs.length).toBe(2);
    actualRefs.forEach((ref) => {
      expect(expectedRefs.some((expected) => expected.ref === ref.name)).toBe(
        true
      );
    });
  });
});
