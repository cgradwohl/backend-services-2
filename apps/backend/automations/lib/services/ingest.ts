import {
  AutomationRunStatus,
  IAutomation,
  IAutomationRunContext,
  IngestibleAutomation,
  IStep,
} from "../../types";
import contextStore from "../stores/automation-run-context-store";
import jsonStore from "../stores/automation-store";

const getObjectKey = (tenantId: string, runId: string) =>
  `${tenantId}/${runId}.json`;

export default (tenantId: string) => {
  return {
    createAutomationRun: async (
      runId: string,
      run: IngestibleAutomation,
      context: IAutomationRunContext
    ) => {
      const key = getObjectKey(tenantId, runId);

      const automation: IAutomation = {
        cancelationToken: run.cancelation_token ?? run.cancelationToken,
        context: key,
        createdAt: new Date().toISOString(),
        dryRunKey: run.dryRunKey,
        runId,
        scope: run.scope,
        source: run.source,
        status: AutomationRunStatus.processing,
        steps: run.steps,
        tenantId,
        type: "automation-run",
      };

      await contextStore.put(key, context);
      await jsonStore.put(key, automation); // triggers automation worker
    },

    getIngestedRun: async (runId: string): Promise<IAutomation> => {
      const key = getObjectKey(tenantId, runId);
      return jsonStore.get(key);
    },

    getIngestedRunStep: async (
      runId: string,
      stepId: string
    ): Promise<IStep> => {
      const key = getObjectKey(tenantId, runId);
      const { steps } = await jsonStore.get(key);
      return steps.find((s: IStep) => s.stepId === stepId);
    },
  };
};
