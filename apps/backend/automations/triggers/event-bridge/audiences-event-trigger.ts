import { extendStep } from "~/automations/lib/extend-step";
import { EventBridgeHandler } from "aws-lambda";
import { invokeAutomation } from "~/automations/lib/invoke-automation";
import automationTemplatesService from "~/automations/lib/services/templates";
import createTraceId from "~/lib/x-ray/create-trace-id";
import { TenantRouting, TenantScope } from "~/types.internal";
import { WebhookEventTypes } from "~/webhooks/types";
import { IAutomationRunContext } from "~/automations/types";

type Worker = EventBridgeHandler<
  "audiences-automation-trigger",
  {
    audienceId: string;
    dryRunKey: TenantRouting;
    userId: string;
    workspaceId: string;
    source: Extract<
      WebhookEventTypes,
      "audiences:user:matched" | "audiences:user:unmatched"
    >;
    scope: TenantScope;
    trackingId: string;
  },
  void
>;

const worker: Worker = async (record) => {
  const { scope, workspaceId, trackingId, source, userId, audienceId } =
    record.detail;

  const automationTemplates = automationTemplatesService(workspaceId, scope);

  const templates = [
    ...(await automationTemplates.listBySource(`${source}/${audienceId}`)),
    // wildcard template in case there is no specific audience id attached as audience trigger
    ...(await automationTemplates.listBySource(`${source}/*`)),
  ];

  if (!templates) {
    return;
  }

  const runContext: IAutomationRunContext = {
    recipient: userId,
  };

  await Promise.all(
    templates.map(async (template) => {
      const runId = createTraceId();

      const extendedSteps = template.json.steps.map((step) =>
        extendStep(step, runContext)
      );

      await invokeAutomation({
        cancelation_token: template.cancelation_token,
        steps: extendedSteps,
        context: runContext,
        runId,
        scope,
        source: [`${source}/${template.templateId}/${trackingId}`],
        tenantId: workspaceId,
      });
    })
  );
};

export default worker;
