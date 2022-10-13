import { SQSRecord } from "aws-lambda";
import { toUuid } from "~/lib/api-key-uuid";
import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import { getBrandVariables } from "~/lib/brands/brand-variables";
import { cacheService } from "~/lib/cache-service";
import captureException from "~/lib/capture-exception";
import * as categoryService from "~/lib/category-service";
import shouldFilter from "~/lib/conditional-filter";
import {
  createErrorEvent,
  createFilteredEvent,
  createMappedEvent,
  createProfileLoadedEvent,
  createUnmappedEvent,
  createUnroutableEvent,
} from "~/lib/dynamo/event-logs";
import { get as getProfile, IProfileObject } from "~/lib/dynamo/profiles";
import { enqueueByQueueUrl } from "~/lib/enqueue";
import { PreparationError } from "~/lib/errors";
import { create as createEventMap, get as getEventMap } from "~/lib/event-maps";
import { getFeatureTenantTemplateVariation } from "~/lib/get-launch-darkly-flag";
import handleErrorLog from "~/lib/handle-error-log";
import log from "~/lib/log";
import logger from "~/lib/logger";
import { hasDrafts } from "~/lib/notification-service/draft";
import extractConfigurations from "~/lib/notifications/extract-configurations";
import jsonStore from "~/lib/s3";
import { createEventHandlerWithFailures } from "~/lib/sqs/create-event-handler";
import { get as getTenant } from "~/lib/tenant-service";
import createVariableHandler from "~/lib/variable-handler";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import {
  CourierObject,
  IBrand,
  IConfigurationJson,
  INotificationCategoryJson,
  INotificationJsonWire,
  INotificationWire,
  S3APIInput,
} from "~/types.api";
import {
  CourierRenderOverrides,
  ICacheVariation,
  S3Message,
  S3PrepareMessage,
  SqsPrepareMessage,
  SqsRouteMessage,
} from "~/types.internal";
import {
  IPreference,
  IProfilePreferences,
  PreferenceStatus,
} from "~/types.public";
import {
  isRetryable,
  retrySqsMessage,
} from "~/workers/utils/retry-sqs-message";
import getBrand from "./lib/get-brand";
import getConfigurations from "./lib/get-configurations";
import getDefaultBrand from "./lib/get-default-brand";
import getLatestBrand from "./lib/get-latest-brand";
import getLatestDefaultBrand from "./lib/get-latest-default-brand";
import getLatestDraft from "./lib/get-latest-draft";
import getNotification from "./lib/get-notification";

// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");

const enqueueRoute = enqueueByQueueUrl<SqsRouteMessage>(
  process.env.SQS_ROUTE_QUEUE_URL
);

const { put: putMessage } = jsonStore<S3Message>(
  process.env.S3_MESSAGES_BUCKET
);
const { put: putAPIInput } = jsonStore<S3APIInput>(
  process.env.S3_MESSAGES_BUCKET
);
const { get } = jsonStore<S3PrepareMessage>(process.env.S3_MESSAGES_BUCKET);

const cache = cacheService();

const getNotificationSafe = async ({ id, tenantId }) => {
  try {
    const notification = await getNotification(tenantId, id);
    return notification;
  } catch (err) {
    if (err.statusCode === 404) {
      return undefined;
    }
    console.error(err);
    throw err;
  }
};

const getNotificationDraftSafe = async ({ id, tenantId }) => {
  try {
    const notification = await getLatestDraft(tenantId, id);
    return notification;
  } catch (err) {
    if (err.statusCode === 404) {
      return undefined;
    }
    console.error(err);
    throw err;
  }
};

const getNotificationSubmittedSafe = async ({ id, tenantId }) => {
  try {
    const notification = await getLatestDraft(tenantId, id);

    const { canceled, checkConfigs, submitted } = notification.json;

    // use most recent draft if checks are enabled and it was submitted but not canceled
    if (checkConfigs?.[0].enabled && submitted && submitted > (canceled ?? 0)) {
      return notification as INotificationWire;
    }

    // else use published
    return await getNotificationSafe({ id, tenantId });
  } catch (err) {
    if (err.statusCode === 404) {
      return undefined;
    }
    console.error(err);
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
    ? getBrand(tenantId, id, {
        extendDefaultBrand: true,
      })
    : getLatestBrand(tenantId, id);
};

const getScopedDefaultBrand = async (
  tenantId: string,
  state: "published" | "draft" | "submitted"
) => {
  return ["published", "submitted"].includes(state) // get published brand for submitted state as well
    ? getDefaultBrand(tenantId)
    : getLatestDefaultBrand(tenantId);
};

const getRecipientPreferences = async (
  notification: INotificationWire,
  recipientProfile: IProfileObject, // comes off the userID
  eventMessage: S3PrepareMessage // comes from request
): Promise<IProfilePreferences> => {
  if (notification.json?.preferenceTemplateId && recipientProfile) {
    const preferenceTemplateUuId = toUuid(
      notification.json?.preferenceTemplateId
    );
    const resourceId = `${recipientProfile.id}#${preferenceTemplateUuId}`;

    const recipientPreferencesIfExists = (
      await preferenceTemplateService(notification.tenantId, "").get<{
        value: IPreference;
      }>("recipients", resourceId)
    )?.value;

    const defaultPreferences = await preferenceTemplateService(
      notification.tenantId,
      ""
    ).get<{ defaultStatus: PreferenceStatus }>(
      "templates",
      preferenceTemplateUuId
    );

    return {
      notifications: {
        [notification.id]: {
          ...{ status: defaultPreferences },
          ...recipientPreferencesIfExists,
        },
      },
    };
  }

  // If there is no preferenceTemplateId follow the regular flow, this indicates notification template is not tied to any preference grouping
  return mergePreferences(
    recipientProfile?.preferences,
    eventMessage.eventPreferences
  );
};

/*
  Processes a request from the Send API and determines if a published or draft
  template can be routed based on its channels.

  A template may not be routed for following reasons:
   * Unmapped
   * It has no channels
   * The channel does not have a send integration
   * It has been filtered out by conditions
*/
const prepare = async (rawMessage: SqsPrepareMessage): Promise<void> => {
  try {
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

    // tslint:disable-next-line: no-console
    const defaultVariation = {
      brand: 0,
      configurations: 0,
      drafts: 0,
      notification: 0,
    };

    const cacheVariation =
      await getFeatureTenantTemplateVariation<ICacheVariation>(
        "cache-prepare-dynamo-queries",
        tenantId,
        defaultVariation
      );

    const {
      brand: brandCache,
      configurations: configurationsCache,
      drafts: draftsCache,
      notification: notificationCache,
    } = cacheVariation; // if launchdarkly bails out, we should be returning default values

    logger.debug(`Preparing with variation ${JSON.stringify(cacheVariation)}`);

    const eventMap = await getEventMap({
      eventId: message.eventId,
      tenantId,
    });

    let notificationId: string | undefined = eventMap?.notifications?.length
      ? eventMap.notifications[0].notificationId
      : undefined;
    let notification: INotificationWire;

    const [state, environment] = message?.scope?.split("/") ?? [
      "published",
      "production",
    ];

    if (!message?.scope) {
      log(
        `Missing scope: ${tenantId}, ${messageId}, ${rawMessage.messageLocation.path}`
      );
    }

    assertStateIsValid(state);

    if (notificationId) {
      notification = await cache.get<CourierObject<INotificationJsonWire>>(
        `${tenantId}/${notificationId}/template`,
        () => getScopedNotification(notificationId, tenantId, state),
        notificationCache
      );

      if (notification && notification.archived) {
        notification = undefined;
      }
    } else {
      // no event map was found. Check for a notificationId
      try {
        notificationId = toUuid(message.eventId);
      } catch (err) {
        // do nothing
        log(JSON.stringify(err, null, 2));
      }

      if (notificationId) {
        notification = await cache.get<CourierObject<INotificationJsonWire>>(
          `${tenantId}/${notificationId}/template`,
          () => getScopedNotification(notificationId, tenantId, state),
          notificationCache
        );

        if (notification && notification.archived) {
          throw new PreparationError("Notification template not found");
        }
      }
    }

    const brandConfig =
      notification && notification.json?.brandConfig
        ? notification.json.brandConfig
        : {
            defaultBrandId: undefined,
            enabled: false,
          };
    const brandEnabled = brandConfig.enabled;
    const getBrand = () => {
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
    const brand = await cache.get<IBrand>(
      `${tenantId}/${notificationId}/brand`,
      () => getBrand(),
      brandCache
    );

    const courierRenderOverrides: CourierRenderOverrides = {
      environment: environment === "production" ? "production" : "test",
      scope: state, // published, draft, submitted
    };

    // persist API call to S3
    await putAPIInput(`${tenantId}/${messageId}.input.json`, {
      _meta: {
        messageId,
        tenantId,
      },
      brand,
      courier: courierRenderOverrides,
      data: message.eventData,
      dryRunKey: message.dryRunKey,
      event: message.eventId,
      override: message.override,
      profile: message.eventProfile,
      recipient: message.recipientId,
      scope: message.scope,
    });

    if (!notification) {
      await createUnmappedEvent(tenantId, messageId, {
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
      return;
    }

    await createMappedEvent(tenantId, messageId, {
      eventId: message.eventId,
      fromMap: Boolean(eventMap),
      notificationId,
    });

    const configurationIds = extractConfigurations(notification);
    const missingProviders = !configurationIds || !configurationIds.length;

    const hasNotificationDrafts = await cache.get<boolean>(
      `${tenantId}/${notificationId}/drafts`,
      () =>
        hasDrafts({
          id: notificationId,
          tenantId,
        }),
      draftsCache
    );

    // A draft list of one and missing providers means the notification hasn't been published
    // Zero means the notification hasn't gone through the draft system yet and is legacy
    // Other values > 1 means it's been published
    if (!hasNotificationDrafts && missingProviders) {
      const reason = `Notification hasn't been published. Current version does not have channels and providers.`;
      await createUnroutableEvent(tenantId, messageId, "UNPUBLISHED", reason);

      return;
    }

    if (missingProviders) {
      await createUnroutableEvent(
        tenantId,
        messageId,
        "NO_PROVIDERS",
        "No providers added"
      );
      return;
    }

    const configurations = await cache.get<
      Array<CourierObject<IConfigurationJson>>
    >(
      `${tenantId}/${notificationId}/configurations`,
      () => getConfigurations(tenantId, configurationIds),
      configurationsCache
    );

    if (!configurations || !configurations.length) {
      throw new PreparationError("No matching provider configurations found");
    }

    const recipientProfile =
      (await getProfile(tenantId, message.recipientId)) ??
      ({ id: message.recipientId } as IProfileObject); // if no profile, use the recipientId as the profile

    const preferences = await getRecipientPreferences(
      notification,
      recipientProfile,
      message
    );

    const profile = mergeProfiles(
      getRecipientProfile(recipientProfile),
      message.eventProfile
    );

    await createProfileLoadedEvent(tenantId, messageId, {
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
      await createFilteredEvent(tenantId, messageId, {
        condition: notification.json.conditional,
      });

      return;
    }

    const { clickThroughTracking, emailOpenTracking } = await getTenant(
      tenantId
    );

    let category: CourierObject<INotificationCategoryJson>;
    if (notification.json.categoryId) {
      category = await categoryService.get({
        id: notification.json.categoryId,
        tenantId,
      });
    }

    const saveAndEnqueue = async (
      savedNotification: INotificationWire,
      options: {
        filename?: string;
        shouldVerifyRequestTranslation?: boolean;
        translated?: boolean;
      } = {}
    ) => {
      const filename = options.filename || messageId;
      const shouldVerifyRequestTranslation =
        options?.shouldVerifyRequestTranslation ?? false;
      const translated = options?.translated ?? false;
      const filePath = `${tenantId}/${filename}.json`;

      if (savedNotification.json.channels.bestOf.length === 0) {
        return;
      }

      await putMessage(filePath, {
        brand,
        category,
        clickThroughTracking,
        configurations,
        courier: courierRenderOverrides,
        data: message.eventData,
        dryRunKey: message.dryRunKey,
        emailOpenTracking,
        eventId: message.eventId,
        extendedProfile: recipientProfile ? recipientProfile.json : null,
        notification: savedNotification,
        override: message.override,
        preferences,
        profile,
        recipientId: message.recipientId,
        scope: message.scope,
        sentProfile: message.eventProfile,
      });

      await enqueueRoute({
        messageId,
        messageLocation: {
          path: filePath,
          type: "S3",
        },
        shouldVerifyRequestTranslation,
        tenantId,
        type: "route",
        translated,
      });
    };

    const { channels } = notification.json;

    await Promise.all(
      channels.always.map<Promise<void>>((channel) => {
        return saveAndEnqueue(
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
          {
            filename: `${messageId}.${channel.id}`,
            shouldVerifyRequestTranslation:
              rawMessage?.shouldVerifyRequestTranslation ?? false,
            translated: rawMessage?.translated ?? false,
          }
        );
      })
    );

    await saveAndEnqueue(notification, {
      shouldVerifyRequestTranslation:
        rawMessage?.shouldVerifyRequestTranslation ?? false,
      translated: rawMessage?.translated ?? false,
    });
  } catch (e) {
    log(JSON.stringify(e, null, 2));
    log(JSON.stringify(rawMessage, null, 2));
    handleErrorLog(e);
    await captureException(e);

    if (e instanceof PreparationError) {
      await createErrorEvent(
        rawMessage.tenantId,
        rawMessage.messageId,
        e.toString()
      );
    } else {
      // tslint:disable-next-line: no-console
      console.error(
        "Error preparing message",
        JSON.stringify(rawMessage, null, 2)
      );

      const retryable = isRetryable(rawMessage);

      await createErrorEvent(
        rawMessage.tenantId,
        rawMessage.messageId,
        "Internal Courier Error",
        {
          willRetry: retryable,
        }
      );

      if (retryable) {
        await retrySqsMessage(rawMessage);
      }
    }
  }
};

export const handleRecord = async (record: SQSRecord) => {
  const message = (
    typeof record.body === "string" ? JSON.parse(record.body) : record.body
  ) as SqsPrepareMessage;
  await prepare(message);
};

export default createEventHandlerWithFailures(
  handleRecord,
  process.env.PREPARE_SEQUENCE_TABLE
);
