import { BadRequest } from "~/lib/http-errors";
import { assertBody, handleIdempotentApi } from "~/lib/lambda-response";
import parseJsonObject from "~/lib/parse-json-object";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { invokeAutomation } from "../lib/invoke-automation";
import templatesService from "../lib/services/templates";
import { validateSteps } from "../lib/validate-steps";
import { IAutomationRunContext, IRenderedAutomationTemplate } from "../types";

export default handleIdempotentApi(async (context) => {
  const body = assertBody<any>(context);

  const { tenantId, dryRunKey, scope } = context;
  const { brand, template, recipient } = body;

  const automation = parseJsonObject(body.automation) as any;
  const data = parseJsonObject(body.data);
  const override = parseJsonObject(body.override);
  const profile = parseJsonObject(body.profile);

  // either an id or alias
  const { templateId } = context.event.pathParameters ?? {};

  if (override) {
    throw new BadRequest(
      "Invalid request property. 'override' is only applicable to send and send-list steps."
    );
  }

  if (!automation && !templateId) {
    throw new BadRequest(
      "Either an ad hoc automation or valid templateId is required."
    );
  }

  const runId = createTraceId();

  const templates = templatesService(tenantId, scope);

  const runContext: IAutomationRunContext = {
    brand,
    data,
    profile,
    recipient,
    template,
  };

  // TEMPLATE CASE
  if (templateId) {
    const automationTemplate =
      (await templates.get(templateId)) ??
      (await templates.getByAlias(templateId));

    if (!automationTemplate) {
      throw new BadRequest("Invalid TemplateId.");
    }

    const { json, template: jsonnet } = automationTemplate;

    if (!json && !jsonnet) {
      throw new BadRequest(
        "Invalid Template. Please provide a JSON template definition."
      );
    }

    if (json && jsonnet) {
      throw new BadRequest(
        "Invalid Template. Please provide a JSON or Jsonnet template definition. (Not both)."
      );
    }

    if (jsonnet) {
      // NOTE: jsonnet is depreacted
      let rendered: IRenderedAutomationTemplate = null;
      try {
        rendered = templates.render(automationTemplate.template, data, profile);
      } catch (error) {
        throw new BadRequest("Invalid Template.");
      }

      await validateSteps(rendered.steps, runContext, tenantId);

      await invokeAutomation({
        cancelation_token:
          rendered.cancelation_token ?? rendered.cancelationToken,
        steps: rendered.steps,
        context: runContext,
        runId,
        dryRunKey,
        scope,
        source: [`invoke/${templateId}`],
        tenantId,
      });

      return {
        body: {
          runId,
        },
      };
    }

    await validateSteps(json.steps, runContext, tenantId);

    await invokeAutomation({
      cancelation_token: automationTemplate.cancelation_token,
      steps: json.steps,
      context: runContext,
      runId,
      dryRunKey,
      scope,
      source: [`invoke/${templateId}`],
      tenantId,
    });

    return {
      body: {
        runId,
      },
    };
  }

  // AD HOC CASE
  if (!automation.steps || !automation.steps.length) {
    throw new BadRequest(
      "Invalid automation definition. An array of valid steps is required."
    );
  }

  await validateSteps(automation.steps, runContext, tenantId);

  await invokeAutomation({
    cancelation_token:
      automation.cancelation_token ?? automation.cancelationToken,
    steps: automation.steps,
    context: runContext,
    runId,
    dryRunKey,
    scope,
    source: ["invoke"],
    tenantId,
  });

  return {
    body: {
      runId,
    },
  };
});
