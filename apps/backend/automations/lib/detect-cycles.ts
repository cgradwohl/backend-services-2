import { IInvokeStep, IStep } from "../types";
import { AutomationInvokeCycleError } from "./errors";

// compare invoke steps to ensure they do not create cycle
export const detectCycles = (source: string[], steps: IStep[]) => {
  const templates = steps
    .filter((step: IStep) => step.action === "invoke")
    .map((step: IInvokeStep) => step.template);

  if (!templates.length) {
    return;
  }

  // see if template exists in the source array
  const hasCycles = templates.some((template) =>
    source.some((invokeSource) => invokeSource.includes(template))
  );

  if (hasCycles) {
    throw new AutomationInvokeCycleError();
  }
};
