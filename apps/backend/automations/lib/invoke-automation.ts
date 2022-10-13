import runsService from "./services/runs";
import stepFactory from "./services/step-factory";
import { IInvocableAutomationDefinition } from "../types";
import { AutomationInvokeDefinitionError } from "./errors";

export const invokeAutomation = async (
  definition: IInvocableAutomationDefinition
) => {
  const {
    cancelation_token,
    steps,
    context,
    runId,
    dryRunKey,
    scope,
    source,
    tenantId,
  } = definition;

  if (!steps || !Array.isArray(steps)) {
    throw new AutomationInvokeDefinitionError(
      "Invalid automation definition. Steps not defined or defined incorrectly."
    );
  }

  if (!context) {
    throw new AutomationInvokeDefinitionError(
      "Invalid automation definition. Must provide context."
    );
  }

  if (!runId) {
    throw new AutomationInvokeDefinitionError(
      "Invalid automation definition. Must provide runId."
    );
  }

  if (!scope) {
    throw new AutomationInvokeDefinitionError(
      "Invalid automation definition. Must provide scope."
    );
  }

  if (!source) {
    throw new AutomationInvokeDefinitionError(
      "Invalid automation definition. Must provide source."
    );
  }

  if (!tenantId) {
    throw new AutomationInvokeDefinitionError(
      "Invalid automation definition. Must provide tenantId."
    );
  }

  const runs = runsService(tenantId);
  const factory = stepFactory(tenantId);

  await runs.invoke({
    // NOTE: remove cancelationToken, deprecated syntax
    cancelation_token: cancelation_token,
    context,
    dryRunKey,
    runId,
    scope,
    source,
    steps: steps.map((step) => {
      return factory.create(runId, step);
    }),
  });
};
