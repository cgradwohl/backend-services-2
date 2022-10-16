import { invokeAutomation } from "~/automations/lib/invoke-automation";
import {
  AutomationRunStatus,
  IAutomationRunContext,
  IRenderedAutomationTemplate,
} from "~/automations/types";
import { InboundSegmentRequestTypes, IRecord } from "~/segment/types";
import createEventHandler from "~/lib/kinesis/create-event-handler";
import createTraceId from "~/lib/x-ray/create-trace-id";
import requests from "~/tracking-requests/services/tracking-requests";
import ingestService from "~/automations/lib/services/ingest";
import runsService from "~/automations/lib/services/runs";
import stepFactory from "~/automations/lib/services/step-factory";
import automationTemplatesService from "~/automations/lib/services/templates";

async function handler(record: IRecord) {
  const {
    dryRunKey,
    scope,
    tenantId,
    trackingId,
    shouldUseInboundSegmentEventsKinesis,
  } = record;
  const factory = stepFactory(tenantId);

  const { createAutomationRun } = ingestService(tenantId);
  const { updateStatus } = runsService(tenantId);

  const request = await requests(tenantId, scope, dryRunKey).get(
    trackingId,
    shouldUseInboundSegmentEventsKinesis
  );
  const { automation, brand, data, event, profile, user } = request;
  const segmentRequestType = data.type as InboundSegmentRequestTypes;

  const runContext: IAutomationRunContext = {
    brand,
    data,
    profile,
    recipient: user,
    template: event,
  };

  if (automation) {
    const runId = createTraceId();

    try {
      await invokeAutomation({
        cancelation_token:
          automation.cancelation_token ?? automation.cancelationToken,
        steps: automation.steps,
        context: runContext,
        runId,
        scope,
        source: [`${segmentRequestType}/${event}/${trackingId}`],
        tenantId,
      });
    } catch (err) {
      // TODO: better error handling
      updateStatus(runId, AutomationRunStatus.error);
    }
  }

  const automationTemplates = automationTemplatesService(tenantId, scope);
  const templates = [
    ...(await automationTemplates.listBySource(
      `${segmentRequestType}/${event}`
    )),
    ...(await automationTemplates.listBySource(
      `segment/${segmentRequestType}/${event}`
    )),
  ];

  if (!templates) {
    return;
  }

  await Promise.all(
    templates.map(async (template) => {
      const runId = createTraceId();

      try {
        //jsonnet case
        if (template.template) {
          let rendered: IRenderedAutomationTemplate = null;
          rendered = automationTemplates.render(
            template.template,
            data,
            profile
          );

          await invokeAutomation({
            cancelation_token:
              rendered.cancelation_token ?? rendered.cancelationToken,
            steps: rendered.steps,
            context: runContext,
            runId,
            scope,
            source: [`${segmentRequestType}/${event}/${trackingId}`],
            tenantId,
          });
        }
        //json case
        else {
          await invokeAutomation({
            cancelation_token: template.cancelation_token,
            steps: template?.json?.steps,
            context: runContext,
            runId,
            scope,
            source: [`${segmentRequestType}/${event}/${trackingId}`],
            tenantId,
          });
        }
      } catch (err) {
        console.error(err);
        // TODO: better error handling
        updateStatus(runId, AutomationRunStatus.error);
      }
    })
  );
}

export const worker = createEventHandler(handler);
