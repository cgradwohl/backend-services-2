import { EventBridgeHandler } from "aws-lambda";
import { IRenderedAutomationTemplate, Step } from "~/automations/types";

import { InvalidAutomationTemplate } from "~/automations/lib/errors";
import temlpatesService from "~/automations/lib/services/templates";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { invokeAutomation } from "~/automations/lib/invoke-automation";

type Worker = EventBridgeHandler<
  // detail-type
  string,
  // detail
  {
    tenantId: string;
    templateId: string;
    scope: string;
    source: string;
  },
  // result
  void
>;

export async function worker(event): Promise<Worker> {
  const { alias, tenantId, templateId, scope, source } = event.detail;

  const runId = createTraceId();

  const templates = temlpatesService(tenantId, scope);
  const template =
    (await templates.get(templateId)) ?? (await templates.getByAlias(alias));

  if (!template) {
    throw new InvalidAutomationTemplate("Invalid TemplateId");
  }

  const { json, template: jsonnet } = template;

  if (!json && !jsonnet) {
    throw new InvalidAutomationTemplate(
      `Invalid Template. The template ${templateId} is not defined. Template has to have either JSON or JSONNET.`
    );
  }

  if (json && jsonnet) {
    throw new InvalidAutomationTemplate(
      `Invalid Template. The template ${templateId} is not defined. Template has to have either JSON or JSONNET but not both.`
    );
  }

  if (jsonnet) {
    let rendered: IRenderedAutomationTemplate = null;
    try {
      rendered = templates.render(
        template.template,
        {}, // TODO: need to get webhook data into template
        {} // TODO: need to get webhook profile into template
      );
    } catch (error) {
      throw new InvalidAutomationTemplate("Invalid TemplateId");
    }

    // TODO: need to consume webhook data when creating steps for rendered automation
    await invokeAutomation({
      cancelation_token:
        rendered.cancelation_token ?? rendered.cancelationToken,
      steps: rendered.steps,
      // TODO: need to supply run context to a scheduled run
      context: {
        brand: undefined,
        data: undefined,
        profile: undefined,
        recipient: undefined,
        template: undefined,
      },
      runId,
      scope,
      source,
      tenantId,
    });
    return;
  }

  await invokeAutomation({
    cancelation_token: template.cancelation_token,
    steps: json.steps,
    // TODO: need to supply run context to a scheduled run
    context: {
      brand: undefined,
      data: undefined,
      profile: undefined,
      recipient: undefined,
      template: undefined,
    },
    runId,
    scope,
    source,
    tenantId,
  });

  return;
}
