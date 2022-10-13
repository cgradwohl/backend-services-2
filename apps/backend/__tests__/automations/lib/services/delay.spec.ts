import {
  AutomationStepStatus,
  IDelayOptions,
  IDelayStep,
} from "~/automations/types";
import delayService from "~/automations/lib/services/delay";
import { InvalidDelayConfigurationError } from "~/automations/lib/errors";

//Mocking the steps service to be empty since it unneccesarily
//tries to call sentry, which gives environment variable errors
jest.mock("~/automations/lib/services/steps", () => () => {});

const step_base: IDelayStep = {
  action: "delay",
  created: "",
  ref: "duplicate",
  runId: "runId-1",
  status: AutomationStepStatus.processing,
  stepId: "stepId-1",
  tenantId: "tenantId-1",
  updated: "",
  duration: "To Replace",
};

describe("Delay Service: constructor", () => {
  it("should handle error if invalid delay step is given", () => {
    expect(() => {
      new delayService({
        ...step_base,
        duration: "", //No duration provided
      });
    }).toThrow(InvalidDelayConfigurationError);
  });
});

describe("Delay Service: enqueueDelay", () => {
  const options: IDelayOptions = { scope: "draft/test", source: [] };

  it("should start step function if delay is less than 48 hrs", async () => {
    const delay = new delayService({
      ...step_base,
      duration: "2820 minutes", // 47 hours in minutes
    });
    let startDelayStepFunctionSpy = jest
      .spyOn(delay, "startDelayStepFunction")
      .mockImplementation(() => undefined);
    let enterDelayToDynamoSpy = jest
      .spyOn(delay, "enterDelayToDynamo")
      .mockImplementation(() => undefined);

    await delay.enqueueDelay(options);
    expect(startDelayStepFunctionSpy.mock.calls.length).toBe(1);
    expect(enterDelayToDynamoSpy.mock.calls.length).toBe(0);
  });

  it("should enter to dynamo if delay is greater than 48 hrs", async () => {
    const delay = new delayService({
      ...step_base,
      duration: "49 hours",
    });
    let startDelayStepFunctionSpy = jest
      .spyOn(delay, "startDelayStepFunction")
      .mockImplementation(() => undefined);
    let enterDelayToDynamoSpy = jest
      .spyOn(delay, "enterDelayToDynamo")
      .mockImplementation(() => undefined);

    await delay.enqueueDelay(options);
    expect(startDelayStepFunctionSpy.mock.calls.length).toBe(0);
    expect(enterDelayToDynamoSpy.mock.calls.length).toBe(1);
  });
});
