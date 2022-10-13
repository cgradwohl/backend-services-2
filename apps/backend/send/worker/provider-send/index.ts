import { get as getProviderConfiguration } from "~/lib/configurations-service";
import { DeliveryProgressionMetric } from "~/lib/courier-emf/logger-metrics-utils";
import {
  createProviderAttemptEvent,
  createSentEvent,
} from "~/lib/dynamo/event-logs";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import { PricingPlan } from "~/lib/plan-pricing";
import { RouteNode, RouteTimeoutTable } from "~/lib/send-routing";
import createVariableHandler from "~/lib/variable-handler";
import sendHandlers from "~/providers/send-handlers";
import { getRenderedOutput } from "~/send/service/rendered-output";
import { ISendProviderPayload, SendActionCommands } from "~/send/types";
import { handlePossibleTimeout } from "~/send/utils/get-age";
import { IChannel } from "~/types.api";
import { handleSendError } from "./handle-send-error";
import { mockSend } from "./mock-send";

export async function handler(payload: ISendProviderPayload) {
  let provider: string;
  let channel: IChannel;
  let pricingPlan: PricingPlan;
  let tree: RouteNode;
  let timeouts: RouteTimeoutTable;

  try {
    const renderedOutput = await getRenderedOutput({
      filePath: payload.outputFilePath,
    });
    const { deliveryHandlerParams, renderedTemplates } = renderedOutput;
    pricingPlan = renderedOutput.pricingPlan;
    tree = renderedOutput.tree;
    timeouts = renderedOutput.timeouts;

    // TODO:: replace this call by simply reading the config from rendered-output in S3
    // https://linear.app/trycourier/issue/C-5217/normalize-pipeline-s3-data
    const providerConfig = await getProviderConfiguration({
      id: payload.configurationId,
      tenantId: payload.tenantId,
    });

    if (!providerConfig) {
      throw new Error(
        `Provider Configuration Not Found. The configurationId: '${payload.configurationId}' was not found.`
      );
    }

    provider = providerConfig.json.provider;
    channel = deliveryHandlerParams.channel;
    const { retryCount } = payload as ISendProviderPayload & {
      retryCount: number;
    };

    if (payload?.dryRunKey === "mock") {
      await mockSend({
        payload,
        provider,
        providerConfigId: payload.configurationId,
        channel: deliveryHandlerParams.channel,
      });
      return;
    }

    // TODO remove after failover hits GA
    const maxAge = deliveryHandlerParams.variableData?.maxAge;
    if (maxAge && !payload.address) {
      const timedout = await handlePossibleTimeout({
        maxAge,
        channel: payload.channel,
        provider: providerConfig.json.provider,
        tenantId: payload.tenantId,
        messageId: payload.messageId,
        retryCount,
      });

      if (timedout) return;
    }

    await createProviderAttemptEvent(
      payload.tenantId,
      payload.messageId,
      provider,
      payload.configurationId,
      deliveryHandlerParams.channel
    );

    const sendHandler = sendHandlers[provider];
    const response = await sendHandler(
      {
        ...deliveryHandlerParams,
        linkHandler: undefined,
        variableHandler: createVariableHandler({
          value: deliveryHandlerParams.variableData,
        }),
      },
      renderedTemplates
    );

    await createSentEvent(
      payload.tenantId,
      payload.messageId,
      provider,
      payload.configurationId,
      response,
      deliveryHandlerParams.channel
    );

    await DeliveryProgressionMetric({
      action: SendActionCommands.Send,
      properties: {
        traceId: payload.requestId,
        tenantId: payload.tenantId,
      },
    });
  } catch (error) {
    await handleSendError({
      payload,
      error,
      provider,
      providerConfigId: payload.configurationId,
      channel,
      timeouts,
      pricingPlan,
      tree,
    });
  }
}

export default createEventHandlerWithFailures(
  handler,
  process.env.PROVIDER_SEND_STREAM_SEQUENCE_TABLE
);
