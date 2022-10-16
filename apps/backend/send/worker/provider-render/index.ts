import captureException from "~/lib/capture-exception";
import { get as getProviderConfiguration } from "~/lib/configurations-service";
import {
  DeliveryProgressionMetric,
  sendErrorMetric,
  translationComparisonMetric,
  translationProgressionMetric,
} from "~/lib/courier-emf/logger-metrics-utils";
import { createMd5Hash } from "~/lib/crypto-helpers";
import { createErrorEvent, createRenderedEvent } from "~/lib/dynamo/event-logs";
import { InternalCourierError } from "~/lib/errors";
import getChannelName from "~/lib/get-channel-name";
import { JsonnetEvalError } from "~/lib/jsonnet";
import { HandlebarsEvalError } from "~/lib/jsonnet/jsonbars";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import { CourierLogger } from "~/lib/logger";
import { findPricingPlanForTenant } from "~/lib/plan-pricing";
import providers from "~/providers";
import { IProvider, IProviderWithTemplatesBase } from "~/providers/types";
import { FailedPreconditionSendError, InternalSendError } from "~/send/errors";
import { RetryableSendError, SendError } from "~/send/errors/types";
import { messageService, sendService } from "~/send/service";
import contextService from "~/send/service/context";
import { putRenderedOutput } from "~/send/service/rendered-output";
import {
  IRenderedOutput,
  IRenderProviderPayload,
  SendActionCommands,
} from "~/send/types";
import { failover, FailoverOpts } from "~/send/utils/failover";
import { isTemplateMessage } from "~/send/utils/is-template-message";
import { retryMessage } from "~/send/utils/retry-message";
import {
  CourierObject,
  IChannel,
  IChannelProvider,
  IConfigurationJson,
  ITenant,
} from "~/types.api";
import { ElementalError } from "./elemental";
import { ChannelRenderFailedError, InvalidBlockTypeError } from "./errors";
import { getChannelRendered } from "./get-channel-rendered";
import { getDeliveryHandlerParams } from "./get-delivery-handler-params";
import { getRenderedTemplates } from "./get-rendered-templates";
import { handleTrackingRecords } from "./handle-tracking-records";

export * from "./errors";

export async function handler(payload: IRenderProviderPayload) {
  if (payload?.shouldVerifyRequestTranslation === true) {
    return await renderForTranslationVerification(payload);
  }

  const { logger } = new CourierLogger("provider-render");
  const contexts = contextService(payload.tenantId);
  const messages = messageService(payload.tenantId);

  // hack to prevent retry's on fetching error
  let channelRendered;
  let tenant: ITenant;
  try {
    const [context, { message }] = await Promise.all([
      contexts.get({ filePath: payload.contextFilePath }),
      messages.get({ filePath: payload.messageFilePath }),
    ]);
    tenant = context.tenant;

    const { retryCount } = payload as IRenderProviderPayload & {
      retryCount: number;
    };

    // channelRendered comes from the Studio Notification Designer UI only
    const channelContext = getChannelRendered(
      context,
      payload.channelId,
      payload.configurationId
    );

    // TODO:: replace this call by simply reading the config from route-output in S3
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
    const provider = providers[providerConfig.json.provider];
    const taxonomy = getTaxonomy(
      channelContext,
      provider,
      providerConfig,
      payload
    );

    const channel =
      getChannelName({
        taxonomy,
      }) ?? "custom";

    channelRendered = {
      ...channelContext.channelRendered,
      taxonomy,
    };

    const providerRendered = channelContext.providerRendered;

    const brand = context.brands.channels[channel] ?? context.brands.main;

    const {
      channelOverride,
      renderedTemplates,
      trackingRecords,
      templateConfig,
    } = await getRenderedTemplates(context, {
      brand,
      channel,
      channelRendered,
      dryRunKey: payload.dryRunKey,
      providerConfig,
    });

    const savedTrackingRecords = await handleTrackingRecords(context, {
      channelRendered,
      providerConfig,
      trackingRecords,
      messageId: payload.messageId,
      taxonomy,
    });

    const renderedOutputPayload = {
      messageId: payload.messageId,
      json: {
        deliveryHandlerParams: getDeliveryHandlerParams(context, {
          brand,
          channelOverride,
          channelRendered,
          messageId: payload.messageId,
          providerConfig,
          providerRendered,
          renderedTemplates,
          savedTrackingRecords,
          template: isTemplateMessage(message) ? message.template : undefined,
          templateConfig,
        }),
        renderedTemplates,
        tree: context.routingTree,
        tenant: context.tenant,
        timeouts: context.timeouts,
        pricingPlan: findPricingPlanForTenant(tenant),
      } as IRenderedOutput,
    };

    const { filePath } = await putRenderedOutput(renderedOutputPayload);

    await createRenderedEvent(
      context.tenant.tenantId,
      payload.messageId,
      providerConfig.json.provider,
      providerConfig.id,
      channelRendered,
      renderedTemplates,
      savedTrackingRecords?.trackingIds,
      brand && {
        id: brand?.id,
        version: brand?.version,
      },
      filePath
    );

    await DeliveryProgressionMetric({
      action: SendActionCommands.Render,
      properties: {
        traceId: payload.requestId,
        tenantId: payload.tenantId,
      },
    });

    await sendService(payload.tenantId).emit({
      command: "send",
      channel,
      channelId: payload.channelId,
      contextFilePath: payload.contextFilePath,
      dryRunKey: payload.dryRunKey,
      outputFilePath: filePath,
      messageId: payload.messageId,
      configurationId: payload.configurationId,
      requestId: payload.requestId,
      tenantId: payload.tenantId,
      messageFilePath: payload.messageFilePath,
      address: payload.address,
      times: payload.times,
      translated: payload?.translated,
    });
  } catch (error) {
    const errorContext = {
      command: "render",
      configurationId: payload.configurationId,
      messageId: payload.messageId,
      messageFilePath: payload.messageFilePath,
      requestId: payload.requestId,
      tenantId: payload.tenantId,
    };

    const isRenderingError =
      error instanceof InvalidBlockTypeError ||
      error instanceof JsonnetEvalError ||
      error instanceof HandlebarsEvalError ||
      error instanceof ElementalError;

    const isRetryableError =
      error instanceof RetryableSendError ||
      error instanceof ChannelRenderFailedError ||
      InternalCourierError.isInternalCourierError(error);

    const retryMessagePayload = {
      ...payload,
      streamName: process.env.PROVIDER_RENDER_STREAM,
    };

    await createErrorEvent(
      payload.tenantId,
      payload.messageId,
      isRetryableError || isRenderingError
        ? error.toString()
        : "Encountered an error rendering message content. Please contact Courier Customer Support",
      {
        channel: channelRendered,
        configuration: payload.configurationId,
        provider: channelRendered?.providers?.find(
          (provider) => provider.configurationId === payload.configurationId
        )?.key,
        willRetry: isRetryableError,
      }
    );

    const failoverOpts: FailoverOpts | undefined =
      payload.address && payload.times
        ? {
            ...payload,
            pricingPlan: tenant ? findPricingPlanForTenant(tenant) : "custom",
          }
        : undefined;

    if (isRetryableError) {
      await retryMessage(retryMessagePayload, failoverOpts);

      const retryableError =
        error instanceof RetryableSendError
          ? error
          : new InternalSendError(error, errorContext);

      logger.error(retryableError);

      await sendErrorMetric({
        action: payload,
        error: retryableError,
        tenantId: payload.tenantId,
        traceId: payload.requestId,
      });

      return;
    }

    if (isRenderingError && failoverOpts) {
      await failover(failoverOpts);

      const renderingError = new InternalSendError(error.message, errorContext);

      logger.error(renderingError);

      await sendErrorMetric({
        action: payload,
        error: renderingError,
        tenantId: payload.tenantId,
        traceId: payload.requestId,
      });
      return;
    }

    const failedPreconditionError = new FailedPreconditionSendError(
      error.message,
      errorContext
    );

    logger.error(failedPreconditionError);

    await sendErrorMetric({
      action: payload,
      error: failedPreconditionError,
      tenantId: payload.tenantId,
      traceId: payload.requestId,
    });

    // this should cause an alarm
    await captureException(error);
  }
}

export default createEventHandlerWithFailures<IRenderProviderPayload>(
  handler,
  process.env.PROVIDER_RENDER_STREAM_SEQUENCE_TABLE
);

function getTaxonomy(
  channelContext: {
    channelRendered?: IChannel;
    providerRendered?: IChannelProvider;
  },
  provider: IProvider | IProviderWithTemplatesBase,
  providerConfig: CourierObject<IConfigurationJson>,
  payload: IRenderProviderPayload
) {
  if (channelContext.channelRendered?.taxonomy) {
    return channelContext.channelRendered?.taxonomy;
  }

  if (provider.taxonomy?.class === "sms") {
    return `direct_message:sms:${providerConfig.json.provider}`;
  }

  if (payload.channel === "courier") {
    return `push:web:courier`;
  }

  if (
    providerConfig.json.provider === "courier" &&
    payload.channel === "banner"
  ) {
    return "banner:courier";
  }

  if (
    providerConfig.json.provider === "courier" &&
    payload.channel === "inbox"
  ) {
    return "inbox:courier";
  }

  const channel = provider.taxonomy?.channel ?? "custom";
  return `${channel}:${providerConfig.json.provider}`;
}

const renderForTranslationVerification = async (
  payload: IRenderProviderPayload
) => {
  const { logger } = new CourierLogger(
    "RENDER COMMAND: TRANSLATION VERIFICATION"
  );
  logger.debug("shouldVerifyRequestTranslation === true");

  await translationProgressionMetric({
    action: SendActionCommands.Render,
    properties: {
      traceId: payload.requestId,
      tenantId: payload.tenantId,
    },
    version: "v2",
  });

  const contexts = contextService(payload.tenantId);
  const messages = messageService(payload.tenantId);

  // hack to prevent retry's on fetching error
  let channelRendered;
  try {
    const [context, { requestId }] = await Promise.all([
      contexts.get({ filePath: payload.contextFilePath }),
      messages.get({ filePath: payload.messageFilePath }),
    ]);

    const { retryCount } = payload as IRenderProviderPayload & {
      retryCount: number;
    };

    // channelRendered comes from the Studio Notification Designer UI only
    const channelContext = getChannelRendered(
      context,
      payload.channelId,
      payload.configurationId
    );

    // TODO:: replace this call by simply reading the config from route-output in S3
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
    const provider = providers[providerConfig.json.provider];
    const taxonomy = (() => {
      if (channelContext.channelRendered?.taxonomy) {
        return channelContext.channelRendered?.taxonomy;
      }

      if (provider.taxonomy?.class === "sms") {
        return `direct_message:sms:${providerConfig.json.provider}`;
      }

      if (payload.channel === "courier") {
        return `push:web:courier`;
      }

      if (
        providerConfig.json.provider === "courier" &&
        payload.channel === "banner"
      ) {
        return "banner:courier";
      }

      if (
        providerConfig.json.provider === "courier" &&
        payload.channel === "inbox"
      ) {
        return "inbox:courier";
      }

      const channel = provider.taxonomy?.channel ?? "custom";
      return `${channel}:${providerConfig.json.provider}`;
    })();

    const channel =
      getChannelName({
        taxonomy,
      }) ?? "custom";

    channelRendered = {
      ...channelContext.channelRendered,
      taxonomy,
    };

    const brand = context.brands.channels[channel] ?? context.brands.main;

    const { renderedBlocks } = await getRenderedTemplates(context, {
      brand,
      channel,
      channelRendered,
      dryRunKey: payload.dryRunKey,
      providerConfig,
    });

    await translationComparisonMetric({
      requestVersion: "v2",
      tenantId: payload.tenantId,
      properties: [
        {
          traceId: requestId,
        },
        {
          hashedRenderedOutput: createMd5Hash(JSON.stringify(renderedBlocks)),
        },
      ],
    });

    return;
  } catch (error) {
    logger.warn("RENDER FOR TRANSLATION VERIFICATION ERROR");
    logger.warn(error);
  }
};
