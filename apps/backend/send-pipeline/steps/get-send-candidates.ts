import EventEmitter from "events";
// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

import {
  CourierObject,
  INotificationCategoryJson,
  INotificationWire,
  S3APIInput,
} from "~/types.api";
import { S3Message, S3PrepareMessage } from "~/types.internal";
import { IProfilePreferences } from "~/types.public";

import shouldFilter from "~/lib/conditional-filter";

import { toUuid } from "~/lib/api-key-uuid";
import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import {
  get as getPublishedBrand,
  getDefault,
  getLatest,
  getLatestDefault,
} from "~/lib/brands";
import * as categoryService from "~/lib/category-service";
import { batchGet as batchGetConfigurations } from "~/lib/configurations-service";
import { get as getProfile } from "~/lib/dynamo/profiles";
import { PreparationError } from "~/lib/errors";
import { create as createEventMap, get as getEventMap } from "~/lib/event-maps";
import { get as getNotification } from "~/lib/notification-service";
import * as notificationDraftService from "~/lib/notification-service/draft";
import extractConfigurations from "~/lib/notifications/extract-configurations";
import jsonStore from "~/lib/s3";
import { get as getTenant } from "~/lib/tenant-service";
import createVariableHandler from "~/lib/variable-handler";
import { getBrandVariables } from "~/lib/brands/brand-variables";

import { PipelineStepFn } from "../types";

const emitter = new EventEmitter();

const { put: putMessage } = jsonStore<S3Message>(
  process.env.S3_MESSAGES_BUCKET
);
const { put: putAPIInput } = jsonStore<S3APIInput>(
  process.env.S3_MESSAGES_BUCKET
);
const { get } = jsonStore<S3PrepareMessage>(process.env.S3_MESSAGES_BUCKET);

const getNotificationSafe = async ({ id, tenantId }) => {
  try {
    const notification = await getNotification({ id, tenantId });

    return notification as INotificationWire;
  } catch (err) {
    if (err.statusCode === 404) {
      return undefined;
    }
    throw err;
  }
};

const getNotificationDraftSafe = async ({ id, tenantId }) => {
  try {
    const notification = await notificationDraftService.getLatestDraft({
      notificationId: id,
      tenantId,
    });

    return notification as INotificationWire;
  } catch (err) {
    if (err.statusCode === 404) {
      return undefined;
    }
    throw err;
  }
};

const getNotificationSubmittedSafe = async ({ id, tenantId }) => {
  try {
    const notification = await notificationDraftService.getLatestDraft({
      notificationId: id,
      tenantId,
    });

    const { canceled, checkConfigs, submitted } = notification.json;

    // use most recent draft if checks are enabled and it was submitted but not canceled
    if (checkConfigs?.[0].enabled && submitted && submitted > (canceled ?? 0)) {
      return notification as INotificationWire;
    }

    // else use published
    return (await getNotificationSafe({ id, tenantId })) as INotificationWire;
  } catch (err) {
    if (err.statusCode === 404) {
      return undefined;
    }
    throw err;
  }
};

const mergePreferences = (
  recipientProfilePreferences: IProfilePreferences,
  eventProfilePreferences: IProfilePreferences
): IProfilePreferences => {
  return jsonMerger.mergeObjects([
    recipientProfilePreferences ?? {},
    eventProfilePreferences ?? {},
  ]);
};

const mergeProfiles = (recipientProfileJson: any, eventProfileJson: any) => {
  return jsonMerger.mergeObjects([
    recipientProfileJson ?? {},
    eventProfileJson ?? {},
  ]);
};

const getRecipientProfile = (recipientProfile) =>
  recipientProfile && recipientProfile.json
    ? typeof recipientProfile.json === "string"
      ? JSON.parse(recipientProfile.json)
      : recipientProfile.json
    : {};

const getScopedNotification = async (
  id: string,
  tenantId: string,
  state: "published" | "draft" | "submitted"
) => {
  switch (state) {
    case "published": {
      return getNotificationSafe({
        id,
        tenantId,
      });
    }
    case "draft": {
      return getNotificationDraftSafe({ id, tenantId });
    }
    case "submitted": {
      return getNotificationSubmittedSafe({ id, tenantId });
    }
  }
};

const getScopedBrand = async (
  tenantId: string,
  id: string,
  state: "published" | "draft" | "submitted"
) => {
  return ["published", "submitted"].includes(state) // get published brand for submitted state as well
    ? getPublishedBrand(tenantId, id, {
        extendDefaultBrand: true,
      })
    : getLatest(tenantId, id);
};

const getScopedDefaultBrand = async (
  tenantId: string,
  state: "published" | "draft" | "submitted"
) => {
  return ["published", "submitted"].includes(state) // get published brand for submitted state as well
    ? getDefault(tenantId)
    : getLatestDefault(tenantId);
};

const getSendCandidates: PipelineStepFn = async (context) => {
  const { params: rawMessage } = context;
  const { messageId, tenantId } = rawMessage;
  let message: S3PrepareMessage;

  switch (rawMessage.messageLocation.type) {
    case "S3":
      message = await get(rawMessage.messageLocation.path);
      break;
    case "JSON":
      message = rawMessage.messageLocation.path;
      break;
  }

  const eventMap = await getEventMap({
    eventId: message.eventId,
    tenantId,
  });

  let notificationId: string | undefined = eventMap?.notifications?.length
    ? eventMap.notifications[0].notificationId
    : undefined;
  let notification: INotificationWire;

  const [state] = message?.scope?.split("/") ?? ["published"];

  assertStateIsValid(state);

  if (notificationId) {
    notification = await getScopedNotification(notificationId, tenantId, state);

    if (notification && notification.archived) {
      notification = undefined;
    }
  } else {
    // no event map was found. Check for a notificationId
    try {
      notificationId = toUuid(message.eventId);
    } catch (err) {
      // do nothing
    }

    if (notificationId) {
      notification = await getScopedNotification(
        notificationId,
        tenantId,
        state
      );
    }
  }

  const brandConfig =
    notification && notification.json.brandConfig
      ? notification.json.brandConfig
      : {
          defaultBrandId: undefined,
          enabled: false,
        };
  const brandEnabled = brandConfig.enabled;
  const getBrand = async () => {
    if (!brandEnabled) {
      return;
    }

    if (message.brand) {
      return message.brand;
    }

    if (brandConfig.defaultBrandId) {
      return getScopedBrand(tenantId, brandConfig.defaultBrandId, state);
    }

    return getScopedDefaultBrand(tenantId, state);
  };

  // use default brand if not provided
  const brand = await getBrand();

  // persist API call to S3
  await putAPIInput(`${tenantId}/${messageId}.input.json`, {
    _meta: {
      messageId,
      tenantId,
    },
    brand,
    data: message.eventData,
    event: message.eventId,
    override: message.override,
    profile: message.eventProfile,
    recipient: message.recipientId,
    scope: message.scope,
  });

  if (!notification) {
    emitter.emit("onUnmappedEvent", tenantId, messageId, {
      eventId: message.eventId,
    });

    if (!eventMap) {
      // make it easier to map the event later
      await createEventMap({
        eventId: message.eventId,
        notifications: [],
        tenantId,
      });
    }

    return { result: "UNMAPPED", success: false };
  }

  emitter.emit("onMappedEvent", tenantId, messageId, {
    eventId: message.eventId,
    fromMap: Boolean(eventMap),
    notification,
  });

  const configurationIds = extractConfigurations(notification);
  const missingProviders = !configurationIds ?? !configurationIds.length;

  const { objects: drafts } = await notificationDraftService.list({
    ExpressionAttributeValues: {
      ":notificationId": notification.id,
    },
    FilterExpression: `begins_with(id, :notificationId)`,
    tenantId,
  });

  // A draft list of one and missing providers means the notification hasn't been published
  // Zero means the notification hasn't gone through the draft system yet and is legacy
  // Other values > 1 means it's been published
  if (drafts.length === 1 && missingProviders) {
    emitter.emit("onUnpublished", tenantId, messageId);

    return { result: "UNPUBLISHED", success: false };
  }

  if (missingProviders) {
    emitter.emit("onMissingProviders", tenantId, messageId);

    return { result: "NO_PROVIDERS", success: false };
  }

  const configurations = await batchGetConfigurations({
    configurationIds,
    tenantId,
  });

  if (!configurations || !configurations.length) {
    throw new PreparationError("No matching provider configurations found");
  }

  const recipientProfile = await getProfile(tenantId, message.recipientId);

  const preferences = mergePreferences(
    recipientProfile?.preferences,
    message.eventPreferences
  );

  const profile = mergeProfiles(
    getRecipientProfile(recipientProfile),
    message.eventProfile
  );

  emitter.emit("onProfileLoaded", tenantId, messageId, {
    mergedProfile: profile,
    savedProfile: getRecipientProfile(recipientProfile),
    sentProfile: message.eventProfile,
  });

  const variableHandler = createVariableHandler({
    value: {
      brand: getBrandVariables(brand),
      data: message.eventData,
      profile,
    },
  });
  if (shouldFilter(variableHandler, notification.json.conditional)) {
    emitter.emit("onFiltered", tenantId, messageId, {
      condition: notification.json.conditional,
    });

    return { result: "FILTERED", success: false };
  }

  const { clickThroughTracking, emailOpenTracking } = await getTenant(tenantId);

  let category: CourierObject<INotificationCategoryJson>;
  if (notification.json.categoryId) {
    category = await categoryService.get({
      id: notification.json.categoryId,
      tenantId,
    });
  }

  const getEnvelope = async (
    template: INotificationWire,
    options: {
      filename?: string;
    } = {}
  ) => {
    const filename = options.filename ?? messageId;
    const filePath = `${tenantId}/${filename}.json`;

    if (template.json.channels.bestOf.length === 0) {
      return;
    }

    await putMessage(filePath, {
      brand,
      category,
      clickThroughTracking,
      configurations,
      data: message.eventData,
      emailOpenTracking,
      eventId: message.eventId,
      extendedProfile: recipientProfile ? recipientProfile.json : null,
      notification: template,
      override: message.override,
      preferences,
      profile,
      recipientId: message.recipientId,
      scope: message.scope,
      sentProfile: message.eventProfile,
    });

    return {
      messageId,
      messageLocation: {
        path: filePath,
        type: "S3",
      },
      tenantId,
      type: "route",
    };
  };

  const { channels } = notification.json;

  const candidates = (
    await Promise.all(
      channels.always.map(async (channel) =>
        getEnvelope(
          {
            ...notification,
            json: {
              ...notification.json,
              channels: {
                always: [],
                bestOf: [channel],
              },
            },
          },
          { filename: `${messageId}.${channel.id}.${message.recipientId}` }
        )
      )
    )
  )
    .concat(
      await getEnvelope(notification, {
        filename: `${messageId}.${message.recipientId}`,
      })
    )
    .filter(Boolean);

  return { result: candidates, success: true };
};

export default getSendCandidates;
