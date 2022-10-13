import { IAutomationRunContext, ISendStepV2, Step } from "../types";
import { extendStep } from "./extend-step";
import { validateV2RequestHardcoded } from "~/api/send/validation/validate-v2-request-hardcoded";
import validationSchemas from "~/automations/schemas";
import { BadRequest } from "~/lib/http-errors";
const schemas = validationSchemas({ additionalProperties: false });
export const validateSteps = async (
  steps: Step[],
  context: IAutomationRunContext,
  tenantId: string
) => {
  const extendedSteps = steps.map((step) => extendStep(step, context));

  const stepsToValidate = extendedSteps.filter(
    (step) => !(step as ISendStepV2).message
  );
  if (stepsToValidate.length && !schemas.validateAllSteps(stepsToValidate)) {
    throw new BadRequest(
      "Invalid Steps Definition: one or more steps are incorrectly defined."
    );
  }

  const messages = extendedSteps
    .filter((step) => (step as ISendStepV2).message)
    .map((step) => (step as ISendStepV2).message);

  if (messages.length) {
    // validate with throw a BadRequest Error
    await Promise.all(
      messages.map(
        async (message) =>
          await validateV2RequestHardcoded({ message }, tenantId)
      )
    );
  }
};
