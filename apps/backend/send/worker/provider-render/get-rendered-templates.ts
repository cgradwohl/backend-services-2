import { Content, MessageData, UTM, UTMMap } from "~/api/send/types";
import getProviderTemplate from "~/handlebars/template";
import getMSTeamsHandlebarsTemplate from "~/handlebars/template/msteams-with-adaptive-cards";

import getTemplateOverrides from "~/handlebars/template/get-template-overrides";
import renderTemplates from "~/handlebars/template/render-templates";
import getBlocks from "~/lib/blocks";
import { applyBlockOverrides } from "~/lib/blocks/apply-overrides";
import { getBrandVariables } from "~/lib/brands/brand-variables";
import createLinkHandler, { ILinkData, ILinkHandler } from "~/lib/link-handler";
import { getLinkTrackingCallback } from "~/lib/tracking-service/get-link-tracking-callback";
import createVariableHandler, {
  IVariableHandler,
} from "~/lib/variable-handler";
import renderHandlers from "~/providers/render-handlers";
import { Block, IChannel, INotificationWire, IProfile } from "~/types.api";
import {
  IBrandContext,
  IProviderConfiguration,
  ISendMessageContext,
} from "../../types";
import { isINotificationWire } from "../commands/lib/type-assertions";
import { composeUtm } from "./augment-href";
import { compileElementalContentMessage } from "./elemental";
import { getTemplateConfig } from "./get-template-config";
import { renderBrand } from "./render-brand";

export async function getRenderedTemplates(
  context: ISendMessageContext,
  opts: {
    brand?: IBrandContext;
    channel: string;
    channelRendered?: IChannel;
    dryRunKey?: string;
    locale?: string;
    providerConfig: IProviderConfiguration;
  }
) {
  const trackingLinks: { [context: string]: ILinkData } = {};
  const { content, tenant, profile } = context;
  const { channel, channelRendered, locale, providerConfig, dryRunKey } = opts;
  const brand = renderBrand({
    brand: opts.brand,
    locale: locale ?? profile.locale,
  });

  const isSMS = channelRendered?.taxonomy?.includes("sms");

  const trackingEnabled =
    tenant.clickThroughTracking?.enabled &&
    !isSMS &&
    channel !== "banner" &&
    dryRunKey !== "mock";

  const trackingHandler = trackingEnabled
    ? await getLinkTrackingCallback(trackingLinks, tenant.tenantId)
    : () => undefined;

  const linkHandler = createLinkHandler(
    trackingLinks,
    trackingEnabled,
    false,
    trackingHandler
  );

  const variableHandler = createVariableHandler({
    value: {
      ...context.variableData,
      // Important. Without this subtle rendering bugs may occur (top bar color doesn't show for example)
      brand: brand ? getBrandVariables(brand) : undefined,
    },
  });

  const { renderedBlocks, title, contentChannelOverride } = compileContent({
    content,
    linkHandler,
    variableHandler,
    brandPartials: brand?.partials,
    channel,
    provider: providerConfig.json.provider,
    locale: locale ?? profile.locale,
    data: context.variableData.data ?? {},
    profile: context.variableData.profile,
  });

  const renderedBlockIds =
    channelRendered?.blockIds ?? renderedBlocks.map((block) => block.id);

  const templateConfig = getTemplateConfig({
    brand,
    channel,
    channelConfig: channelRendered,
    profile,
    providerConfig,
    tenantId: tenant.tenantId,
    title,
  });

  const renderHandler = renderHandlers[providerConfig.json.provider];

  const isEmail = channel === "email";
  const isWebhook = channel === "webhook";

  const variableData = variableHandler.getRootValue();
  if (isEmail) {
    variableData.templateOverrides = getTemplateOverrides(
      templateConfig.brand?.email?.templateOverride
    );
  }

  const providerTemplate = getProviderTemplate({
    allBlocks: renderedBlocks,
    channelBlockIds: renderedBlockIds,
    config: templateConfig,
    isEmail,
    isWebhook,
    provider: providerConfig.json.provider,
    tenant,
    renderOverrides: (template) => ({
      msteamsRenderer: () => getMSTeamsHandlebarsTemplate(template),
    }),
  });

  // TODO: templateMap interface needs to be updated to V2 (using snake case)
  const templateMap = renderHandler(
    providerTemplate,
    templateConfig,
    channelRendered?.config?.locales // TODO: Is this important for content messages?
  );

  const notificationMap = Object.keys(templateMap).reduce((acc, curr) => {
    const value = templateMap[curr];

    if (curr === "clickAction") {
      return { click_action: value, ...acc };
    }

    return { [curr]: value, ...acc };
  }, {});

  const channelOverride =
    contentChannelOverride ?? context?.overrides?.channels?.[channel];

  const renderedTemplates = renderTemplates(
    notificationMap,
    variableHandler,
    linkHandler,
    tenant.tenantId,
    channelOverride
  );

  return {
    channelOverride,
    renderedBlocks,
    renderedTemplates,
    templateConfig,
    trackingRecords: {
      links: trackingLinks,
      openTrackingId: context.variableData?.openTrackingId,
      unsubscribeTrackingId: context.variableData?.unsubscribeTrackingId,
    },
  };
}

interface CompiledContent {
  content: Content | INotificationWire;
  channel: string;
  locale?: string;
  linkHandler: ILinkHandler;
  data: MessageData;
  profile: IProfile;
  provider: string;
  variableHandler: IVariableHandler;
  brandPartials?: {
    [snippetName: string]: string;
  };
}

export function compileContent({
  channel,
  content,
  locale,
  linkHandler,
  variableHandler,
  brandPartials,
  data,
  profile,
  provider,
}: CompiledContent): {
  renderedBlocks: Block[];
  title?: string;
  contentChannelOverride?: Record<string, any>;
} {
  const utmMap = variableHandler.getScoped("utmMap")?.getContext()
    .value as UTMMap;

  if (isINotificationWire(content)) {
    const renderedBlocks = getBlocksFromNotification({
      notificationWire: content,
      linkHandler,
      variableHandler,
      brandPartials,
      utm: composeUtm({ utmMap, channel, provider }),
    });

    return { renderedBlocks };
  }

  const { renderedBlocks, title, channelOverride } =
    compileElementalContentMessage({
      content,
      variableHandler,
      channel,
      locale,
      data,
      profile,
      utm: composeUtm({ utmMap, channel, provider }),
    });

  return { renderedBlocks, title, contentChannelOverride: channelOverride };
}

function getBlocksFromNotification({
  notificationWire,
  linkHandler,
  variableHandler,
  brandPartials,
  utm,
}: {
  notificationWire: INotificationWire;
  linkHandler: ILinkHandler;
  variableHandler: IVariableHandler;
  brandPartials?: {
    [snippetName: string]: string;
  };
  utm?: UTM;
}): Block[] {
  // NOTE: validate this works
  // TODO: support block overrides: https://linear.app/trycourier/issue/C-4891/support-block-overrides
  const allWireBlocks = applyBlockOverrides(
    notificationWire.json.blocks
    // context.override?.blocks  // TODO: support block overrides: https://linear.app/trycourier/issue/C-4891/support-block-overrides
  );

  return getBlocks(
    allWireBlocks,
    linkHandler,
    variableHandler.getScoped("data"),
    utm
  ).map((block) => {
    // TODO: HANDLEBARS: remove this map when HBS ships
    // TODO: this should probably be done on elemental too.
    if (block.type === "template") {
      block.partials = brandPartials;
    }

    return block;
  });
}
