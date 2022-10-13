import { ValueOf } from "~/types.internal";
import * as PublicTypes from "~/types.public";
import { IRenderedTemplatesMap } from "~/handlebars/template/render-templates";
import { TemplateConfig } from "~/handlebars/template/types";
import { DeliveryHandlerParams } from "~/providers/types";
import { IProviderConfiguration, ISendMessageContext } from "~/send/types";
import { IBrand, IChannel, IChannelProvider } from "~/types.api";

export function getDeliveryHandlerParams(
  context: ISendMessageContext,
  {
    brand,
    savedTrackingRecords,
    channelRendered,
    providerRendered,
    channelOverride,
    providerConfig,
    templateConfig,
    messageId,
    template,
  }: {
    brand?: IBrand;
    /**
     * NOTE: casting the MessageChannels type (context.channels) as a V1 Pipeline
     * type since the downstream services require a V1 type.
     */
    channelOverride: ValueOf<
      PublicTypes.ApiSendRequestOverrideChannel["channel"]
    >;
    providerConfig: IProviderConfiguration;
    savedTrackingRecords: {
      trackingUrls: any;
      trackingIds: any;
    };
    templateConfig: TemplateConfig;
    renderedTemplates: IRenderedTemplatesMap;
    messageId: string;
    template?: string;
    channelRendered?: IChannel;
    providerRendered?: IChannelProvider;
  }
): DeliveryHandlerParams {
  const { tenant, profile, variableData } = context;

  const providerOverride =
    context?.overrides?.providers?.[providerConfig.json.provider];

  const deliveryHandlerParams: DeliveryHandlerParams = {
    brand,
    channel: channelRendered,
    channelOverride,
    // Adding it conditionally since we won't have this attributes if we are retrying a historical message
    ...(savedTrackingRecords.trackingUrls?.channelTrackingUrl && {
      channelTrackingUrl: savedTrackingRecords.trackingUrls.channelTrackingUrl,
    }),
    config: providerConfig.json,
    eventId: template,
    messageId,

    // TODO: consider renaming the `override` key to something more meaningful
    override: providerOverride,
    profile,
    recipient: profile?.user_id,
    tags: context?.metadata?.tags,
    tenant,
    tenantId: tenant.tenantId,
    trackingIds: savedTrackingRecords?.trackingIds,

    // channel configuration. Used only by renderEmail -_- (for log previews)
    ...templateConfig?.email,

    // channel provider configuration
    beamerConfig: providerRendered?.config?.beamer,
    chatApiConfig: providerRendered?.config?.chatApi,
    discordConfig: providerRendered?.config?.discord,
    expoConfig: providerRendered?.config?.expo,
    fbMessengerConfig: providerRendered?.config?.fbMessenger,
    firebaseFcmConfig: providerRendered?.config?.firebaseFcm,
    slackConfig: providerRendered?.config?.slack,
    streamChatConfig: providerRendered?.config?.streamChat,
    variableData,
  };

  if (savedTrackingRecords.trackingUrls?.channelTrackingUrl) {
    deliveryHandlerParams.channelTrackingUrl =
      savedTrackingRecords.trackingUrls.channelTrackingUrl;
  }

  return deliveryHandlerParams;
}
