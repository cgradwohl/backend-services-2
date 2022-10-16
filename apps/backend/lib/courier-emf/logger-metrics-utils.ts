import { Unit } from "aws-embedded-metrics";
import { performance } from "perf_hooks";
import { AutomationEntity } from "~/automations/entities/types";
import { UnknownSendError } from "~/send/errors";
import { SendError } from "~/send/errors/types";
import {
  IAction,
  IRenderProviderPayload,
  ISendProviderPayload,
  SendActionCommands,
} from "~/send/types";
import { CourierEmf } from ".";

export async function instrumentStopwatchMetric(
  name,
  cb: Function
): Promise<void> {
  const emfLogger = new CourierEmf(name);
  let startTime: number;

  try {
    startTime = performance.now();
    await cb();
    await timedDimensionalResults({
      emfLogger,
      result: "success",
      startTime,
      endTime: performance.now(),
      name,
    });
  } catch (error) {
    await timedDimensionalResults({
      emfLogger,
      result: "failure",
      startTime,
      endTime: performance.now(),
      name,
    });
    throw error;
  }
}

export async function simpleTransitionMetricCounter({
  caller,
  entity,
  isLegacy = false,
  properties = {},
}: {
  caller: string;
  entity: AutomationEntity;
  isLegacy?: boolean;
  properties?: Record<string, string>;
}) {
  const emfLogger = new CourierEmf(caller);
  const IsLegacy = isLegacy ? "legacy" : "greenfield";
  emfLogger.addProperties([properties]);
  emfLogger.addDimensions([
    {
      Caller: caller,
      Entity: entity,
      IsLegacy,
    },
    {
      Entity: entity,
      IsLegacy,
    },
    {
      IsLegacy,
    },
  ]);
  emfLogger.addMetrics([
    {
      metricName: "Count",
      value: 1,
      unit: Unit.Count,
    },
  ]);

  await emfLogger.end();
}

async function timedDimensionalResults({
  emfLogger,
  result,
  startTime,
  endTime,
  name,
}: {
  emfLogger: CourierEmf;
  result: "success" | "failure";
  startTime: number;
  endTime: number;
  name: string;
}) {
  emfLogger.addDimensions([{ Caller: name, Result: result }]);
  emfLogger.addMetrics([
    {
      metricName: "TimeToComplete",
      value: endTime - startTime,
      unit: Unit.Milliseconds,
    },
    {
      metricName: "Count",
      value: 1,
      unit: Unit.Count,
    },
  ]);
  await emfLogger.end();
}

export async function translationProgressionMetric({
  action,
  version,
  properties,
}: {
  action: SendActionCommands;
  properties: Record<"traceId" | "tenantId", string>;
  version: "v1" | "v2";
}) {
  const emfLogger = new CourierEmf(action);
  emfLogger.addProperties([properties]);
  emfLogger.addDimensions([
    {
      SendAction: action,
      PipelineVersion: version,
    },
  ]);
  emfLogger.addMetrics([
    {
      metricName: "Send Action Count Metric",
      value: 1,
      unit: Unit.Count,
    },
  ]);

  await emfLogger.end();
}

export async function DeliveryProgressionMetric({
  action,
  properties,
}: {
  action: SendActionCommands;
  properties: Record<"traceId" | "tenantId", string>;
}) {
  const emfLogger = new CourierEmf(action);
  emfLogger.addProperties([properties]);

  emfLogger.addDimensions([
    {
      SendAction: action,
    },
  ]);
  emfLogger.addMetrics([
    {
      metricName: "Delivery Progression Metric",
      value: 1,
      unit: Unit.Count,
    },
  ]);

  await emfLogger.end();
}

export async function translationCountMetric({
  properties,
  tenantId,
}: {
  properties: Record<"traceId", string>;
  tenantId: string;
}) {
  const emfLogger = new CourierEmf("TranslateRequestCount");
  emfLogger.addProperties([properties]);

  emfLogger.addDimensions([
    {
      InvocationType: "translation",
    },
    {
      InvocationType: "translation",
      TenantId: tenantId,
    },
  ]);
  emfLogger.addMetrics([
    {
      metricName: "Translate Function Invocation Count Metric",
      value: 1,
      unit: Unit.Count,
    },
  ]);

  await emfLogger.end();
}

export async function translationComparisonMetric({
  requestVersion,
  tenantId,
  properties,
}: {
  requestVersion: "v1" | "v2";
  tenantId: string;
  properties: Array<
    Record<"traceId", string> | Record<"hashedRenderedOutput", string>
  >;
}) {
  const emfLogger = new CourierEmf(requestVersion);
  emfLogger.addProperties(properties);

  emfLogger.addDimensions([
    {
      RequestVersion: requestVersion,
      TenantId: tenantId,
    },
    {
      TenantId: tenantId,
    },
    {
      RequestVersion: requestVersion,
    },
  ]);
  emfLogger.addMetrics([
    {
      metricName: "Translation Output Comparison Metric",
      value: 1,
      unit: Unit.Count,
    },
  ]);

  await emfLogger.end();
}

export const translateAndVerifyBooleanCount = async (params: {
  messageId: string;
  translateToV2: boolean;
}) => {
  const { messageId, translateToV2 } = params;
  const emf = new CourierEmf("TranslateAndVerify");

  emf.addDimensions([{ Metric: "translateV2Request" }]);
  emf.addMetrics([
    {
      metricName: String(translateToV2),
      unit: Unit.Count,
      value: 1,
    },
  ]);

  emf.addProperties([{ messageId }]);

  await emf.end();
};

export const translateAndDeliverBooleanCount = async (params: {
  messageId: string;
  shouldTranslateAndDeliver: boolean;
}) => {
  const { messageId, shouldTranslateAndDeliver } = params;
  const emf = new CourierEmf("TranslateAndDeliver");

  emf.addDimensions([{ Metric: "shouldTranslateAndDeliver" }]);
  emf.addMetrics([
    {
      metricName: String(shouldTranslateAndDeliver),
      unit: Unit.Count,
      value: 1,
    },
  ]);

  emf.addProperties([{ messageId }]);

  await emf.end();
};

export async function sendErrorMetric(params: {
  action: IAction | IRenderProviderPayload | ISendProviderPayload;
  error: SendError | unknown;
  tenantId: string;
  traceId: string;
}) {
  const { action, tenantId, traceId } = params;

  const error =
    params.error instanceof SendError
      ? params.error
      : new UnknownSendError(params.error);

  const emfLogger = new CourierEmf(action.command);

  emfLogger.addProperties([action, error, { tenantId }, { traceId }]);

  emfLogger.addDimensions([
    {
      Command: action.command,
    },
    {
      ErrorType: error.type,
    },
    {
      Command: action.command,
      ErrorType: error.type,
    },
  ]);

  emfLogger.addMetrics([
    {
      metricName: "Send Error Metric",
      value: 1,
      unit: Unit.Count,
    },
  ]);

  await emfLogger.end();
}
