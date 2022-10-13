import {
  InvalidAutomationTemplate,
  InvokeStepAutomationValidationError,
  TemplateCompilationError,
  TemplateNotFoundError,
} from "~/automations/lib/errors";
import { extendStep } from "~/automations/lib/extend-step";
import { invokeAutomation } from "~/automations/lib/invoke-automation";
import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import stepsService from "~/automations/lib/services/steps";
import templatesService from "~/automations/lib/services/templates";
import validationSchemas from "~/automations/schemas";
import {
  AutomationStepStatus,
  IInvokeStep,
  IRenderedAutomationTemplate,
} from "~/automations/types";
import createTraceId from "~/lib/x-ray/create-trace-id";

const schemas = validationSchemas({ additionalProperties: false });

const invokeAutomationStepWorker = async (step: IInvokeStep, params: any) => {
  const { dryRunKey, scope, source } = params;

  const runId = createTraceId();
  const templates = templatesService(step.tenantId, scope);
  const template =
    (await templates.get(step.template)) ??
    (await templates.getByAlias(step.template));

  if (!template) {
    throw new TemplateNotFoundError(
      `Invalid Step Definition: Template ${step.template} not found`
    );
  }

  const { json, template: jsonnet } = template;

  if (!json && !jsonnet) {
    throw new InvalidAutomationTemplate(
      "Invalid Step Definition: json or jsonnet not defined in template"
    );
  }

  if (json && jsonnet) {
    throw new InvalidAutomationTemplate(
      "Invalid Step Definition: can't define both json and jsonnet in template"
    );
  }

  if (jsonnet) {
    let rendered: IRenderedAutomationTemplate = null;
    try {
      rendered = templates.render(
        template.template,
        // NOTE: in addtion to the context define on the invoke step there is also
        // run context that needs to be applied, from the parents run context?
        step.context.data,
        step.context.profile
      );
    } catch (error) {
      throw new TemplateCompilationError(JSON.stringify(error.message));
    }

    const stepsToValidate = rendered.steps.map((step) =>
      extendStep(step, step?.context ?? {})
    );
    if (!schemas.validateAllSteps(stepsToValidate)) {
      throw new InvokeStepAutomationValidationError(
        "Automation being invoked has invalid steps"
      );
    }

    await invokeAutomation({
      cancelation_token:
        rendered.cancelation_token ?? rendered.cancelationToken,
      steps: rendered.steps,
      // NOTE: in addtion to the context define on the invoke step there is also
      // run context that needs to be applied, from the parents run context?
      context: step?.context ?? {},
      dryRunKey,
      runId,
      scope,
      // the last item in the source array is the "invoking" source
      source: [...source, `invoke/${step.template}`],
      tenantId: step.tenantId,
    });

    return runId;
  }

  const stepsToValidate = json.steps.map((step) =>
    extendStep(step, step?.context ?? {})
  );
  if (!schemas.validateAllSteps(stepsToValidate)) {
    throw new InvokeStepAutomationValidationError(
      "Automation being invoked has invalid steps"
    );
  }

  await invokeAutomation({
    cancelation_token: template.cancelation_token,
    steps: json.steps,
    // NOTE: in addtion to the context define on the invoke step there is also
    // run context that needs to be applied, from the parents run context?
    context: step?.context ?? {},
    dryRunKey,
    runId,
    scope,
    // the last item in the source array is the "invoking" source
    source: [...source, `invoke/${step.template}`],
    tenantId: step.tenantId,
  });

  return runId;
};

export default async (step: IInvokeStep, params: any) => {
  const { dryRunKey, scope, source } = params;
  const steps = stepsService(step.tenantId);

  await steps.markStepStatus(step, AutomationStepStatus.processing);
  const runId = await invokeAutomationStepWorker(step, params);
  await steps.markStepStatus(step, AutomationStepStatus.processed, { runId });

  await enqueueAutomationStep({
    dryRunKey,
    runId: step.runId,
    scope,
    source,
    stepId: step.nextStepId,
    tenantId: step.tenantId,
  });
};
