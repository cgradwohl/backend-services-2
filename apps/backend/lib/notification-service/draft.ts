import uuid from "uuid";

import { toApiKey } from "~/lib/api-key-uuid";
import getCourierClient from "~/lib/courier";

import makeError from "make-error";
import { emitNotificationPublishedEvent } from "~/auditing/services/emit";
import * as checkService from "~/lib/check-service/index";
import * as dynamodb from "~/lib/dynamo";
import logger from "~/lib/logger";
import { get as getLocales } from "~/lib/notification-service/locales";
import {
  CourierObject,
  CreateCourierObject,
  INotificationDraftJson,
} from "~/types.api";
import { getUser } from "../cognito";
import dynamoObjectService from "../dynamo/object-service";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import { sendTrackEvent } from "../segment";
import { applyLocales } from "./apply-locales";
import * as notificationService from "./index";

export const DraftConflict = makeError("DraftConflict");

const objtype = "notification-draft";
const draftService = dynamoObjectService<INotificationDraftJson>(objtype);

const courier = getCourierClient({ allowDev: true });

export const archive = draftService.archive;
export const count = draftService.count;
export const create = async ({
  tenantId,
  userId,
  draft,
}: {
  tenantId: string;
  userId: string;
  draft: CreateCourierObject<INotificationDraftJson>;
}) => {
  draft.id = `${draft.json.notificationId}:${uuid.v4()}`;
  const newDraft = await draftService.create({ tenantId, userId }, draft);

  const publishedNotification = await notificationService.get({
    id: draft.json.notificationId,
    tenantId,
  });

  if (publishedNotification.json.draftId) {
    throw new DraftConflict("Draft already exists");
  }

  publishedNotification.json.draftId = draft.id;

  await notificationService.replace(
    { id: publishedNotification.id, tenantId, userId },
    publishedNotification
  );

  return newDraft;
};

export const duplicate = draftService.duplicate;
export const get = async (params: { tenantId: string; id: string }) => {
  const draft = await draftService.get(params);
  const locales = await getLocales({
    tenantId: params.tenantId,
    id: draft.id,
  });

  return applyLocales({
    notification: draft,
    locales,
  });
};

export const getLatestDraft = async (params: {
  notificationId: string;
  tenantId: string;
}) => {
  const { notificationId: id, tenantId } = params;
  const publishedNotification = await notificationService.get({
    id,
    tenantId,
  });

  if (publishedNotification.json.draftId) {
    const draft = await get({
      id: publishedNotification.json.draftId,
      tenantId,
    });

    publishedNotification.json = {
      ...publishedNotification.json,
      blocks: draft.json.blocks,
      brandConfig: draft.json.brandConfig,
      canceled: draft.json.canceled,
      channels: draft.json.channels,
      submitted: draft.json.submitted,
    };
  }

  return publishedNotification;
};
export const list = async (params, options?: { limit?: number }) => {
  let response = await draftService.list(params);
  const { objects } = response;

  if (options?.limit && objects.length >= options?.limit) {
    return {
      objects: objects.slice(0, options?.limit),
    };
  }

  while (response.lastEvaluatedKey) {
    response = await draftService.list({
      ...params,
      exclusiveStartKey: response.lastEvaluatedKey,
    });

    objects.push(...response.objects);

    if (options?.limit && objects.length >= options?.limit) {
      return {
        objects: objects.slice(0, options?.limit),
      };
    }
  }

  return {
    objects,
  };
};

export const hasDrafts = async ({ id, tenantId }): Promise<boolean> => {
  const results = await dynamodb.query({
    ExpressionAttributeNames: {
      "#id": "id",
      "#tenantId": "tenantId",
    },
    ExpressionAttributeValues: {
      ":id": id,
      ":tenantId": tenantId,
    },
    KeyConditionExpression: `#tenantId = :tenantId AND begins_with(#id, :id)`,
    Limit: 2,
    ReturnConsumedCapacity: "TOTAL",
    TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
  });

  logger.debug(
    `consumedCapacity for hasDrafts:- ${results.ConsumedCapacity?.CapacityUnits}`
  );
  return results.Items?.length > 1;
};

export const publish = async ({
  id,
  tenantId,
  userId,
  payload,
}: {
  id: string;
  tenantId: string;
  userId: string;
  payload: {
    message?: string;
  };
}) => {
  const draft = await draftService.get({ id, tenantId });

  if (!draft) {
    throw new Error(`Cannot find Draft: ${id}`);
  }

  if (!draft.json.notificationId) {
    throw new Error("No Associated Notification Id");
  }

  const publishedNotification = await notificationService.get({
    id: draft.json.notificationId,
    tenantId,
  });

  if (!publishedNotification) {
    throw new Error(`Cannot find Notification: ${publishedNotification.id}`);
  }

  if (
    !publishedNotification.json.draftId ||
    publishedNotification.json.draftId !== id
  ) {
    throw new DraftConflict("Can only publish active draft");
  }

  let canPublish = true;
  let canSubmit = false;

  // TODO: look up a particular checkConfig
  // (not a concern right now because we only have at the most 1 item)
  const checksEnabled = publishedNotification?.json?.checkConfigs?.[0]?.enabled;

  if (checksEnabled) {
    // fresh submit or a resubmit
    if (
      !draft.json.submitted ||
      (draft.json.submitted ?? 0) < (draft.json.canceled ?? 0)
    ) {
      canSubmit = true;
      canPublish = false;
    } else {
      // restrict publishing if all the checks aren't resolved
      const checks = await checkService.get({
        id: `${draft.json.notificationId}:${draft.json.submitted}`,
        tenantId,
      });
      if (checks.json.some((check) => check.status !== "RESOLVED")) {
        canPublish = false;
      }
    }
  }

  const timestamp = new Date().getTime();

  // publish
  if (canPublish) {
    publishedNotification.json = {
      ...publishedNotification.json,
      blocks: draft.json.blocks,
      brandConfig: draft.json.brandConfig,
      channels: draft.json.channels,
      draftId: undefined,
    };

    await notificationService.replace(
      { id: publishedNotification.id, tenantId, userId },
      publishedNotification
    );

    // attach published timestamp
    await draftService.replace(
      { id: draft.id, tenantId, userId },
      {
        ...draft,
        json: {
          ...draft.json,
          published: timestamp,
        },
      }
    );

    await sendTrackEvent({
      body: {
        id: publishedNotification.id,
        message: payload.message,
        published: timestamp,
        title: publishedNotification.title,
      },
      key: "notification-published",
      tenantId,
      userId,
    });

    // emit audit event
    let actor: { id: string; email: string };
    try {
      const { email } = await getUser(userId);
      actor = { email, id: userId };
    } catch (err) {
      actor = {
        email: "",
        id: userId,
      };
    }

    const target = {
      id: publishedNotification.id,
    };

    await emitNotificationPublishedEvent(
      tenantId.includes("test") ? "published/test" : "published/production",
      new Date(),
      actor,
      tenantId,
      target
    );

    try {
      // this doesn't exist in our test running env
      if (!courier) {
        return;
      }

      const templateApiKey = toApiKey(publishedNotification.id);
      await courier.lists.send({
        data: {
          templateId: publishedNotification.id,
          templateName: publishedNotification.title,
        },
        event: "TEMPLATE_PUBLISHED",
        list: `tenant.${tenantId}`,
        override: {
          channel: {
            push: {
              data: {
                clickAction: `/designer/notifications/${templateApiKey}`,
                tenantId,
                triggeredBy: userId,
              },
            },
          },
        },
      });
    } catch (ex) {
      // do nothing, list probably doesn't exist yet
    }
  }

  // submit
  if (canSubmit) {
    // attach submitted timestamp
    await draftService.replace(
      { id: draft.id, tenantId, userId },
      {
        ...draft,
        json: {
          ...draft.json,
          submitted: timestamp,
        },
      }
    );

    // add a PENDING check
    await checkService.create(
      {
        tenantId,
        userId,
      },
      {
        id: `${draft.json.notificationId}:${timestamp}`,
        json: [
          {
            id: "custom",
            status: "PENDING",
            type: "custom",
            updated: timestamp,
          },
        ],
      }
    );

    return {
      inReview: true,
      submitted: timestamp,
    };
  }

  return {
    draft: {
      json: {
        blocks: publishedNotification.json.blocks,
        brandConfig: publishedNotification.json.brandConfig,
        channels: publishedNotification.json.channels,
        notificationId: publishedNotification.id,
      },
      title: "Untitled Draft",
    },
    notification: publishedNotification,
  };
};

export const replace = async (
  params: {
    id: string;
    tenantId: string;
    userId?: string;
  },
  draft: CourierObject<INotificationDraftJson>
) => {
  const publishedNotification = await notificationService.get({
    id: draft.json.notificationId,
    tenantId: params.tenantId,
  });

  if (
    !publishedNotification.json.draftId ||
    publishedNotification.json.draftId !== params.id
  ) {
    throw new DraftConflict("Can only update active draft");
  }

  return draftService.replace(params, draft);
};
