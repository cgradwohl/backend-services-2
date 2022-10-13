import EventEmitter from "events";

import { PipelineStepFn } from "../types";

import extendBrand from "~/lib/brands/extend-brand";

import shouldFilter from "~/lib/conditional-filter";
import {
  generateOpenedLink,
  generateUnsubscribeTrackingIdLink,
} from "~/lib/generate-tracking-links";
import { IMessageLog } from "~/lib/message-service/types";

import { getBrandVariables } from "~/lib/brands/brand-variables";
import getChannelLabel from "~/lib/get-channel-label";
import {
  getChannelPreferences,
  getUserPreference,
  mapPreferences,
} from "~/lib/preferences";
import jsonStore from "~/lib/s3";
import { getTrackingDomain } from "~/lib/tracking-domains";
import { generateTrackingId } from "~/lib/tracking-service/generate-tracking-id";
import createVariableHandler from "~/lib/variable-handler";
import providers from "~/providers";
import {
  IBrand,
  IChannel,
  IChannelProvider,
  INotificationWire,
  JSONObject,
} from "~/types.api";
import { S3Message } from "~/types.internal";
import getChannelName from "~/lib/get-channel-name";
const emitter = new EventEmitter();

emitter.emit("onStart");

const { get } = jsonStore<S3Message>(process.env.S3_MESSAGES_BUCKET);

const getRoutableSummary: PipelineStepFn = async (context) => {
  const { params: message } = context;
  let json: S3Message & {
    event?: INotificationWire;
    notification?: INotificationWire;
  };

  switch (message.messageLocation.type) {
    case "S3":
      json = await get(message.messageLocation.path as string);
      break;
    case "JSON":
      json = message.messageLocation.path as S3Message;
      break;
  }

  const {
    configurations,
    data,
    emailOpenTracking = { enabled: true },
    category,
    override,
    preferences,
    recipientId,
  } = json;

  if (typeof override?.channel?.email?.tracking?.open === "boolean") {
    emailOpenTracking.enabled = override.channel.email.tracking.open;
  }

  let { brand } = json;

  const profile = (
    json.profile && typeof json.profile === "object" ? json.profile : {}
  ) as JSONObject;

  // legacy support
  const notification = json.notification ?? json.event;
  const eventId = json.eventId ?? notification.id;
  const openTrackingId = generateTrackingId();
  const unsubscribeTrackingId = generateTrackingId();

  if (brand && override?.brand) {
    brand = extendBrand(brand, override?.brand as Partial<IBrand>);
  }

  const trackingDomain = await getTrackingDomain(message.tenantId);
  // data that can be used in templates
  const variableData = {
    brand: getBrandVariables(brand),
    data,
    event: eventId,
    messageId: message.messageId,
    profile,
    recipient: recipientId,
    urls: {
      opened: emailOpenTracking.enabled
        ? generateOpenedLink(message.tenantId, openTrackingId, trackingDomain)
        : null,
      unsubscribe: generateUnsubscribeTrackingIdLink(
        message.tenantId,
        unsubscribeTrackingId,
        trackingDomain
      ),
    },
  };

  const variableHandler = createVariableHandler({
    value: variableData,
  });

  // build configuration map
  const configurationMap = configurations.reduce(
    (acc, config) => ({
      ...acc,
      [config.id]: config,
    }),
    {}
  );

  const userPreference = getUserPreference({
    category,
    notification,
    preferences,
  });

  if (userPreference) {
    emitter.emit(
      "onOptedOut",
      message.tenantId,
      message.messageId,
      userPreference.reason as IMessageLog["reason"],
      userPreference.message,
      { preferences: mapPreferences(preferences) }
    );

    return { result: userPreference.reason, success: false };
  }

  const handles = (
    { conditional, configurationId }: IChannelProvider,
    c: IChannel
  ) => {
    if (!configurationId) {
      return {
        channel: getChannelName(c),
        channelLabel: getChannelLabel(c),
        reason: "MISSING_CONFIGURATION_ID",
        selected: false,
      };
    }

    if (shouldFilter(variableHandler, conditional)) {
      return {
        channel: getChannelName(c),
        channelLabel: getChannelLabel(c),
        conditional,
        reason: "FILTERED_AT_PROVIDER",
        selected: false,
      };
    }

    const config = configurationMap[configurationId];
    if (!config) {
      return {
        channel: getChannelName(c),
        channelLabel: getChannelLabel(c),
        reason: "MISSING_CONFIGURATION",
        selected: false,
      };
    }

    // Used variable name other than provider to avoid shadow variable collision
    const p = providers[config.json.provider];
    if (!p) {
      return {
        channel: getChannelName(c),
        channelLabel: getChannelLabel(c),
        reason: `MISSING_PROVIDER_SUPPORT`,
        selected: false,
      };
    }

    const canHandle = p.handles({ config, profile, data });

    return {
      channel: getChannelName(c),
      channelLabel: getChannelLabel(c),
      reason: !canHandle ? `INCOMPLETE_PROFILE_DATA` : undefined,
      selected: canHandle,
    };
  };

  const channelHandleResults = [];
  const {
    channels: { bestOf },
  } = notification.json;

  getChannelPreferences(category, notification, preferences, bestOf).find(
    (c) => {
      if (c.disabled) {
        channelHandleResults.push({
          channel: getChannelName(c),
          channelLabel: getChannelLabel(c),
          reason: "CHANNEL_DISABLED",
          selected: false,
        });

        return false;
      }

      if (shouldFilter(variableHandler, c.conditional)) {
        channelHandleResults.push({
          channel: getChannelName(c),
          channelLabel: getChannelLabel(c),
          condition: c.conditional,
          reason: "FILTERED_OUT_AT_CHANNEL",
          selected: false,
        });

        return false;
      }

      const configs = c.providers.reduce((acc, providerConfig) => {
        const config = configurationMap[providerConfig.configurationId];
        const handlesResult = handles(providerConfig, c);

        channelHandleResults.push(handlesResult);

        return handlesResult.selected ? [...acc, config] : acc;
      }, []);

      return configs.length;
    }
  );

  emitter.emit("onRouted", message.tenantId, message.messageId, {
    channelsSummary: channelHandleResults,
    preferences: mapPreferences(preferences),
  });

  return {
    result: { channelsSummary: channelHandleResults, preferences },
    success: true,
  };
};

export default getRoutableSummary;
