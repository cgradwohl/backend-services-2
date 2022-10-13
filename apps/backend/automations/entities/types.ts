import makeError from "make-error";

export const InternalAutomationError = makeError("AutomationError");
export const AutomationArgumentError = makeError("AutomationArgumentError: ");

export class ArgumentRequiredError extends AutomationArgumentError {
  constructor(message: string) {
    super(`${message}`);
  }
}

export class InvalidAutomationEntityError extends InternalAutomationError {
  constructor(message: string) {
    super(`${message}`);
  }
}

export interface AutomationDynamoItem {
  created: string;
  updated: string;
  tenantId: string;
  ___type___: AutomationEntity;
}

export enum AutomationEntity {
  CancelToken = "cancel-token",
  Run = "run",
  Step = "step",
  Ref = "step-reference",
}
