import makeError from "make-error";

export const AutomationError = makeError("AutomationError");

// RUNS
export class RunValidationFailedError extends AutomationError {
  constructor() {
    super("Invalid automation run definition.");
  }
}

// STEPS
export class DuplicateStepRefsDefinedError extends AutomationError {
  constructor() {
    super(
      "Duplicate step ref defined. Please choose a unique ref identifier and try again."
    );
  }
}
export class StepNotFoundError extends AutomationError {
  constructor() {
    super("Internal Courier Error. Step not found.");
  }
}
export class InvalidStepDefinitionError extends AutomationError {
  constructor(message: string) {
    super(`Invalid automation step definition. ${message}`);
  }
}
export class InvalidIdempotencyExpiryError extends AutomationError {
  constructor() {
    super("Invalid idempotent expiry definition.");
  }
}

// DELAY STEP
export class InvalidDelayDurationError extends AutomationError {
  constructor() {
    super("Invalid delay duration definition.");
  }
}
export class InvalidDelayConfigurationError extends AutomationError {
  constructor() {
    super("Invalid automation delay step definition.");
  }
}
export class InvalidDelayIntervalError extends AutomationError {
  constructor() {
    super("Invalid delay interval defined.");
  }
}
export class InvalidStepConditionalError extends AutomationError {
  constructor() {
    super("Invalid automation step conditional definition.");
  }
}

// SEND STEP
export class SendStepContextNotFoundError extends AutomationError {
  constructor() {
    super("Step context not found. Invalid conditional.");
  }
}
export class InvalidBrandId extends AutomationError {
  constructor() {
    super("Invalid Brand ID. Brand Not Found.");
  }
}

// SEND-LIST STEP
export class ListNotFoundError extends AutomationError {
  constructor(message: string) {
    super(`Invalid List ID. List Not Found. ${message}`);
  }
}

//Invoke Step
export class InvokeStepAutomationValidationError extends AutomationError {
  constructor(message: string) {
    super(`Invalid invoke step definition. ${message}`);
  }
}

// UPDATE-CONTEXT (FETCH DATA) STEP
export class UpdateContextFailureError extends AutomationError {
  constructor(message: string) {
    super(`Unable to update context. Error: ${message}`);
  }
}
export class InvalidUpdateContextStep extends AutomationError {
  constructor() {
    super("Invalid update-context step definition.");
  }
}

// STEP REFERENCE
export class InvalidStepReferenceError extends AutomationError {
  constructor() {
    super("Invalid step ref defintion.");
  }
}
export class StepReferenceNotFoundError extends AutomationError {
  constructor() {
    super("Invalid step ref. Ref Not Found.");
  }
}

// Automation Invoke
export class AutomationInvokeDefinitionError extends AutomationError {
  constructor(message: string) {
    super(message);
  }
}
export class AutomationInvokeCycleError extends AutomationError {
  constructor() {
    super(
      "Invalid automation definition. Invoke steps cannot create invocation cycles."
    );
  }
}

// Automation Schedule
export class InvalidScheduleItemError extends AutomationError {
  constructor() {
    super("Invalid automation schedule definition.");
  }
}

// TEMPLATES
export class InvalidAutomationTemplate extends AutomationError {
  constructor(message: string) {
    super(`Invalid automation template. ${message}`);
  }
}
export class TemplateCompilationError extends AutomationError {
  constructor(message: string) {
    super(`${message}`);
  }
}
export class TemplateNotFoundError extends AutomationError {
  constructor(message: string) {
    super(`${message}`);
  }
}
export class DuplicateTemplateAliasError extends AutomationError {
  constructor() {
    super(
      "Invalid automation template alias. The alias already exists. Please create a unique alias."
    );
  }
}
export class TemplateAliasNotFoundError extends AutomationError {
  constructor() {
    super("Invalid automation template alias. Alias Not Found.");
  }
}
