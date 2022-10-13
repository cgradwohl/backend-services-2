import { S3Event, S3EventRecord } from "aws-lambda";
import { detectCycles } from "~/automations/lib/detect-cycles";
import { AutomationInvokeCycleError } from "~/automations/lib/errors";
import { CourierLogger } from "~/lib/logger";
import orchestrator from "../../../lib/services/orchestrator";
import automationRuns from "../../../lib/services/runs";
import jsonStore from "../../../lib/stores/automation-store";
import { AutomationRunStatus, IAutomation } from "../../../types";

const getObject = async (record: S3EventRecord): Promise<IAutomation> =>
  jsonStore.get(record.s3.object.key);

const { logger } = new CourierLogger("Automation Runs Worker");

const automationWorker = async (record: S3EventRecord) => {
  const automation = await getObject(record);

  // ensure tenantId exists
  const runs = automationRuns(automation.tenantId);

  try {
    await runs.create(automation);

    // if cycle exists then throw and stop run execution
    detectCycles(automation.source, automation.steps);

    // triggers step worker
    await orchestrator.execute(automation, automation.steps);
  } catch (error) {
    await runs.updateStatus(automation.runId, AutomationRunStatus.error);

    // catch non-retryable errors Cycle Error
    if (error instanceof AutomationInvokeCycleError) {
      return;
    }

    // stop executing and throw error
    throw error;
  }
};

export default async (event: S3Event) => {
  await Promise.all(event.Records.map(automationWorker));
};
