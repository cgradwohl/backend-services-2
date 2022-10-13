import { IBrandContext, IMessageBrands, PublishedState } from "~/send/types";
import getPublishedState from "~/send/utils/get-published-state";
import { IBrand, INotificationWire } from "~/types.api";
import { TenantScope } from "~/types.internal";
import getBrandLegacy from "~/workers/lib/get-brand";
import getDefaultBrand from "~/workers/lib/get-default-brand";
import getLatestBrand from "~/workers/lib/get-latest-brand";
import getLatestDefaultBrand from "~/workers/lib/get-latest-default-brand";
import {
  MessageBrand,
  MessageBrandV2,
  MessageChannelConfig,
  MessageChannelEmailOverride,
  MessageChannels,
} from "~/api/send/types";
import extendBrand from "~/lib/brands/extend-brand";
import { getBrandPartials } from "./get-brand-partials";
import { createMd5Hash } from "~/lib/crypto-helpers";
import { NotFound } from "~/lib/http-errors";
import { MessageBrandNotFoundError } from "./errors";

const getBrandConfiguration = (notification?: INotificationWire) =>
  notification?.json?.brandConfig
    ? notification.json.brandConfig
    : {
        defaultBrandId: undefined,
        enabled: false,
      };

const getScopedBrand = async (
  tenantId: string,
  id: string,
  state: PublishedState
) => {
  return ["published", "submitted"].includes(state) // get published brand for submitted state as well
    ? getBrandLegacy(tenantId, id, { extendDefaultBrand: true })
    : getLatestBrand(tenantId, id);
};

const getScopedDefaultBrand = async (
  tenantId: string,
  state: PublishedState
) => {
  return ["published", "submitted"].includes(state) // get published brand for submitted state as well
    ? getDefaultBrand(tenantId)
    : getLatestDefaultBrand(tenantId);
};

const getBrandByState = async ({
  tenantId,
  brandId,
  notification,
  scope,
}: {
  brandId?: string;
  notification?: INotificationWire;
  scope: TenantScope;
  tenantId: string;
}) => {
  const brandConfiguration = getBrandConfiguration(notification);

  // We only check brandEnabled for TemplateMessages
  if (notification && !brandConfiguration.enabled) {
    return;
  }

  const state = getPublishedState(scope);

  if (brandId) {
    return getScopedBrand(tenantId, brandId, state);
  }

  if (brandConfiguration.defaultBrandId) {
    return getScopedBrand(tenantId, brandConfiguration.defaultBrandId, state);
  }

  return getScopedDefaultBrand(tenantId, state);
};

export const getBrand = async ({
  tenantId,
  brandId,
  notification,
  scope,
  override,
}: {
  tenantId: string;
  brandId?: string;
  notification?: INotificationWire;
  scope: TenantScope;
  override?: MessageChannelEmailOverride["brand"];
}) => {
  try {
    const brand = await getBrandByState({
      tenantId,
      brandId,
      notification,
      scope,
    });

    if (brand && override) {
      return extendBrand(brand, override);
    }

    return brand;
  } catch (error) {
    if (error instanceof NotFound) {
      throw new MessageBrandNotFoundError("Invalid Brand ID. Brand Not Found.");
    }

    throw error;
  }
};

export const messageBrandV2ToIBrandContext = (
  inline: MessageBrandV2
): IBrandContext => {
  const locales: Record<string, IBrand> = {};
  for (const key in inline.locales ?? {}) {
    locales[key] = messageBrandV2ToIBrandContext({
      version: inline.version,
      ...inline.locales[key],
    });
  }

  return {
    settings: {
      colors: inline.colors,
      email: inline.logo ? { header: { logo: inline.logo } } : undefined,
    },
    locales,
    version: inline.version,
    created: Date.now(),
    creator: "inline",
    id: createMd5Hash(JSON.stringify(inline)),
    name: "inline",
    updated: Date.now(),
    updater: "inline",
  };
};

export const messageBrandToIBrandContext = (
  brand: MessageBrand
): IBrandContext => {
  if (brand.version === "2022-05-17") {
    return messageBrandV2ToIBrandContext(brand);
  }

  return {
    ...brand,
    version: "2020-06-19T18:51:36.083Z",
    created: brand.created ?? Date.now(),
    creator: brand.creator ?? "inline",
    id: brand.id ?? createMd5Hash(JSON.stringify(brand)),
    name: brand.name ?? "inline",
    updated: brand.updated ?? Date.now(),
    updater: brand.updater ?? "inline",
  };
};

export const getBrandContext = async (opts: {
  tenantId: string;
  brandId?: string;
  inlineBrand?: MessageBrand;
  notification?: INotificationWire;
  scope: TenantScope;
  override?: MessageChannelEmailOverride["brand"];
}): Promise<IBrandContext | undefined> => {
  const brand =
    !opts.brandId && opts.inlineBrand
      ? messageBrandToIBrandContext(opts.inlineBrand)
      : await getBrand(opts);

  if (!brand) {
    return undefined;
  }

  const partials = getBrandPartials({ brand, tenantId: opts.tenantId });

  return {
    ...brand,
    partials,
  };
};

/** @returns [channelName, brandId][] */
export const getChannelBrandIds = (
  channels?: MessageChannels
): [string, string | undefined][] =>
  Object.entries(channels ?? {})
    .filter(([, { brand_id }]) => !!brand_id)
    .map(([channel, { brand_id }]) => [channel, brand_id]);

export const getChannelBrands = async ({
  channels,
  notification,
  scope,
  tenantId,
  emailOverride,
}: {
  channels?: MessageChannels;
  emailOverride?: MessageChannelEmailOverride["brand"];
  notification?: INotificationWire;
  scope: TenantScope;
  tenantId: string;
}): Promise<{ [channelName: string]: IBrandContext }> => {
  const mapper = async ([channel, brandId]: [
    string,
    string | undefined
  ]): Promise<[string, IBrandContext | undefined]> => [
    channel,
    await getBrandContext({
      tenantId,
      brandId,
      scope,
      notification,
      override: emailOverride,
    }),
  ];

  const entries = Promise.all(getChannelBrandIds(channels).map(mapper));
  return (await entries).reduce((channels, entry) => {
    (channels as MessageChannels)[entry[0]] = entry[1] as MessageChannelConfig;
    return channels;
  }, {});
};

export const getMessageBrands = async ({
  mainBrandId,
  channels,
  notification,
  scope,
  tenantId,
  emailOverride,
  inlineBrand,
}: {
  emailOverride?: MessageChannelEmailOverride["brand"];
  mainBrandId?: string;
  channels?: MessageChannels;
  notification?: INotificationWire;
  inlineBrand?: MessageBrand;
  scope: TenantScope;
  tenantId: string;
}): Promise<IMessageBrands> => {
  const [main, channelBrands] = await Promise.all([
    getBrandContext({
      brandId: mainBrandId,
      notification,
      scope,
      tenantId,
      override: emailOverride,
      inlineBrand,
    }),
    getChannelBrands({
      channels,
      notification,
      scope,
      tenantId,
      emailOverride,
    }),
  ]);

  return {
    main,
    channels: channelBrands,
  };
};
