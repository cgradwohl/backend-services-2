import axios from "axios";
import idempotentStep from "~/automations/lib/idempotentStep";
import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";
import runsService from "~/automations/lib/services/runs";
import stepsService from "~/automations/lib/services/steps";
import { AutomationStepStatus, IFetchDataStep } from "~/automations/types";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import { CourierLogger } from "~/lib/logger";
import { validateUrl } from "~/lib/validate-webhook-url";
const { logger } = new CourierLogger("AutomationStep: fetch-data");

type FetchData = (params: {
  webhookConfig: IFetchDataStep["webhook"];
}) => Promise<{ data: Record<string, any> }>;

export const fetchWebhook: FetchData = async ({ webhookConfig }) => {
  const { body, url, headers, method, params: urlParams } = webhookConfig;
  try {
    const response = await axios({
      data: body ?? {},
      headers: headers ?? {},
      method: method ?? "GET",
      params: urlParams ?? {},
      timeout: 20000,
      url,
    });

    return { data: response.data };
  } catch (error) {
    logger.warn(error);
    return { data: {} };
  }
};

export default idempotentStep<IFetchDataStep>(async (step, params) => {
  const steps = stepsService(step.tenantId);
  const runs = runsService(step.tenantId);

  await steps.markStepStatus(step, AutomationStepStatus.processing);

  const { dryRunKey, scope, source } = params;

  const { webhook: webhookConfig, merge_strategy: strategy } = step;

  const enableUrlValidation = await getFeatureTenantVariation(
    "enable-webhook-url-validation",
    step.tenantId
  );

  if (enableUrlValidation && !validateUrl(webhookConfig.url)) {
    await steps.markStepStatus(step, AutomationStepStatus.skipped);
  } else {
    const { data } = await fetchWebhook({ webhookConfig });

    await runs.setContext(step.runId, strategy, { data });
    await steps.markStepStatus(step, AutomationStepStatus.processed);
  }

  await enqueueAutomationStep({
    dryRunKey,
    runId: step.runId,
    scope,
    source,
    stepId: step.nextStepId,
    tenantId: step.tenantId,
  });
});
