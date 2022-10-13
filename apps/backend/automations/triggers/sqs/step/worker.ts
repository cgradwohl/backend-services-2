import { SQSEvent, SQSRecord } from "aws-lambda";
import { AutomationError } from "~/automations/lib/errors";
import { enqueueAutomationStep } from "~/automations/lib/services/enqueue";

import automationRuns from "~/automations/lib/services/runs";
import automationSteps from "~/automations/lib/services/steps";

import validationSchemas from "~/automations/schemas";
import {
  AutomationRunStatus,
  AutomationStepStatus,
  ISendStepV2,
} from "~/automations/types";
import captureException from "~/lib/capture-exception";
import commands from "./commands";

const schemas = validationSchemas({ additionalProperties: true });

const stepWorker = async (record: SQSRecord) => {
  // this lambda timeout is 30sec (30000 milli sec)

  const body = JSON.parse(record.body);

  const { dryRunKey, source, scope, tenantId, runId, stepId } = body;

  const runs = automationRuns(tenantId);
  const run = await runs.get(runId);

  const steps = automationSteps(tenantId);
  const step = await steps.get(runId, stepId);

  if (run.status === AutomationRunStatus.canceled) {
    // subsequent steps are NOT PROCESSED
    return;
  }

  if (step.hasOwnProperty("if")) {
    try {
      const result = await steps.evaluateCondition(step);

      if (!result) {
        await steps.markStepStatus(step, AutomationStepStatus.skipped);

        return await enqueueAutomationStep({
          dryRunKey,
          runId: step.runId,
          scope,
          source,
          stepId: step.nextStepId,
          tenantId: step.tenantId,
        });
      }
    } catch (error) {
      await steps.markStepStatus(step, AutomationStepStatus.error, {
        error: { message: "Invalid step conditional" },
      });
      await runs.updateStatus(run.runId, AutomationRunStatus.error);
      return;
    }
  }

  const command = commands[step.action];

  if (!command) {
    await steps.markStepStatus(step, AutomationStepStatus.error, {
      error: { message: `${step.action} is not a valid step action` },
    });
    await runs.updateStatus(run.runId, AutomationRunStatus.error);
    return;
  }

  const validateStep = schemas[step.action];
  if (!(step as ISendStepV2).message && !validateStep(step)) {
    await steps.markStepStatus(step, AutomationStepStatus.error, {
      error: { message: "Invalid step definition" },
    });
    await runs.updateStatus(run.runId, AutomationRunStatus.error);
    return;
  }

  // execute step action
  try {
    await command(step, { dryRunKey, scope, source });
  } catch (error) {
    console.warn(
      "Automation Step Worker Error",
      JSON.stringify(
        {
          error,
          tenantId,
          runId,
          stepId,
        },
        null,
        2
      )
    );
    const message =
      error instanceof AutomationError
        ? error.message
        : "Internal Courier Error";

    const capture = async () => {
      if (error instanceof AutomationError) {
        // do not capture known errors
        return;
      }
      await captureException(error);
    };

    const markError = async () =>
      Promise.all([
        await steps.markStepStatus(step, AutomationStepStatus.error, {
          error: { message },
        }),
        await runs.updateStatus(run.runId, AutomationRunStatus.error),
      ]);

    await Promise.allSettled([await capture(), await markError()]);

    if (error instanceof AutomationError) {
      // do not retry known errors
      return;
    }
    throw error;
  }
};

export default async (event: SQSEvent) => {
  await Promise.all(event.Records.map(stepWorker));
};
