import { DocumentClient } from "aws-sdk/clients/dynamodb";
import uuid from "uuid-apikey";
import { toUuid } from "../api-key-uuid";
import { isAPIKey } from "~/lib/api-key-uuid";

import * as dynamodb from "~/lib/dynamo";
import NotFoundError from "../http-errors/not-found";
import {
  InvalidListSearchPatternError,
  ListItemArchivedError,
  ListItemNotFoundError,
  MalformedListIdError,
} from "./errors";
import fromCourierObject from "./from-courier-object";
import * as patterns from "./patterns";
import { listItemStore, subscriptionStore } from "./stores";

import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import {
  ArchiveFn,
  GetFn,
  GetSubscriptionFn,
  GetSubscriptionsFn,
  IDynamoListItem,
  ListFn,
  PutFn,
  PutSubscriptionsFn,
  RestoreFn,
  SubscribeFn,
  UnsubscribeFn,
} from "./types";
import cleanNotificationPreferences from "./clean-notification-preferences";
import { UnavailableSendError } from "~/send/errors";

const objtype = "list";

const sanitizeId = (id: string) => {
  return isAPIKey(id) ? toUuid(id) : encodeURIComponent(id);
};

const scopeId = (id: string) =>
  id.indexOf(objtype) !== 0 ? `${objtype}/${id}` : id;

const createSubscriptionPointer = () => new Date().toISOString();

const getSubscriptionPointer = async (tenantId: string, listItemId: string) => {
  const id = sanitizeId(listItemId);
  const listItem = (await listItemStore.get({
    id,
    tenantId,
  })) as IDynamoListItem;
  return listItem.subscriptionPointer
    ? `subscription/${listItem.subscriptionPointer}`
    : "subscription";
};

const setSubscriptionPointer = async (
  tenantId: string,
  userId: string,
  listItemId: string,
  subscriptionPointer: string
) => {
  const id = scopeId(sanitizeId(listItemId));

  const setPointer = async () => {
    await dynamodb.update({
      ConditionExpression: "attribute_exists(id)",
      ExpressionAttributeNames: {
        "#subscriptionPointer": "subscriptionPointer",
      },
      ExpressionAttributeValues: {
        ":subscriptionPointer": subscriptionPointer,
      },
      Key: {
        id,
        tenantId,
      },
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
      UpdateExpression: "SET #subscriptionPointer = :subscriptionPointer",
    });
  };

  try {
    await setPointer();
  } catch (e) {
    if (e?.code === "ConditionalCheckFailedException") {
      // auto create new list and set pointer when list does not exist
      await put(tenantId, userId, { id: listItemId });
      await setPointer();
    } else {
      throw e;
    }
  }
};

const related = async (
  tenantId: string,
  id: string,
  type: string,
  options: { exclusiveStartKey?: DocumentClient.Key; limit?: number }
) => {
  const listId = scopeId(`${sanitizeId(id)}/${type}/`);

  const response = await dynamodb.query({
    ExclusiveStartKey: options?.exclusiveStartKey,
    ExpressionAttributeNames: {
      "#id": "id",
      "#tenantId": "tenantId",
    },
    ExpressionAttributeValues: {
      ":id": listId,
      ":tenantId": tenantId,
    },
    KeyConditionExpression: "#tenantId = :tenantId AND begins_with(#id, :id)",
    Limit: options?.limit,
    TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
  });

  return {
    items: response.Items,
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
};

export const archive: ArchiveFn = async (tenantId, userId, id) => {
  const listId = sanitizeId(id);
  try {
    await listItemStore.archive({ id: listId, tenantId, userId });
  } catch (err) {
    if (err?.code === "ConditionalCheckFailedException") {
      throw new ListItemNotFoundError();
    }

    throw err;
  }
};

export const assertValidListId = (id: string) => {
  if (!id.length) {
    throw new MalformedListIdError("List ID cannot be an empty string.");
  }

  if (id.includes("*")) {
    throw new MalformedListIdError("List ID cannot include an asterix (*).");
  }

  if (id.includes("#")) {
    throw new MalformedListIdError("List ID cannot include a pound sign (#).");
  }

  if (id.startsWith(".")) {
    throw new MalformedListIdError("List ID cannot start with a period (.).");
  }

  if (id.endsWith(".")) {
    throw new MalformedListIdError("List ID cannot end with a period (.).");
  }

  if (id.match(/\.\./)?.length) {
    throw new MalformedListIdError(
      "List ID cannot include consecutive periods (.)."
    );
  }

  if (id.match(/ /)?.length) {
    throw new MalformedListIdError("List ID cannot include spaces.");
  }

  if (id.match(/\./g)?.length > 5) {
    throw new MalformedListIdError(
      "List ID cannot include more than six segments."
    );
  }
};

export const assertValidPattern = (pattern: string) => {
  if (pattern === "*") {
    throw new InvalidListSearchPatternError(
      "Pattern cannot match all lists. At least one pattern part must not match: *"
    );
  }

  if (pattern?.length > 2) {
    const dots = pattern && (pattern.match(/\./g) || []).length;
    const asterices = (pattern.match(/\*/g) || []).length;

    // handle patterns that only include asterices and periods
    if (dots + asterices === pattern.length) {
      throw new InvalidListSearchPatternError(
        "Pattern cannot match all lists. At least one pattern part must not match: *"
      );
    }
  }

  if (pattern === "**") {
    throw new InvalidListSearchPatternError(
      "Pattern cannot match all lists. At least one pattern part must not match: **"
    );
  }

  if (pattern?.includes("**") && !pattern.endsWith("**")) {
    throw new InvalidListSearchPatternError(
      "Pattern cannot include a starts with (**) anywhere but at the end."
    );
  }

  if (pattern?.match(/\*{1,}\..*\*\*/g)?.length) {
    throw new InvalidListSearchPatternError(
      "Pattern cannot include an asterix (*) followed by double asterisk matching (**)."
    );
  }

  if (pattern?.endsWith(".")) {
    throw new InvalidListSearchPatternError(
      "Pattern cannot end with a period (.)."
    );
  }

  if (pattern?.startsWith(".")) {
    throw new InvalidListSearchPatternError(
      "Pattern cannot start with a period (.)."
    );
  }

  if (pattern?.match(/\.\./g)?.length) {
    throw new InvalidListSearchPatternError(
      "Pattern cannot include consecutive periods (..)."
    );
  }

  if (pattern?.match(/ /)?.length) {
    throw new InvalidListSearchPatternError("Pattern cannot include spaces.");
  }

  if (pattern?.match(/\*{3,}/)?.length) {
    throw new InvalidListSearchPatternError(
      "Pattern cannot include more than two consecutive asterices (*)."
    );
  }

  if (pattern?.match(/(?!\*)[^\.]\*/)?.length) {
    throw new InvalidListSearchPatternError(
      "Pattern containing an asterix(*) must come after a period (.)"
    );
  }
};

export const findByPattern: ListFn = async (tenantId, options) => {
  const pattern = options?.pattern;

  if (!pattern) {
    return list(tenantId, options);
  }

  // no wildcard, perform an exact match search
  if (pattern.indexOf("*") < 0) {
    const listItem = await get(tenantId, pattern);
    return {
      items: [listItem],
      lastEvaluatedKey: null,
    };
  }

  const { items, lastEvaluatedKey } = await patterns.findByPattern(
    tenantId,
    pattern,
    { exclusiveStartKey: options?.exclusiveStartKey }
  );

  return {
    items: items.map(fromCourierObject),
    lastEvaluatedKey,
  };
};

export const get: GetFn = async (tenantId, id) => {
  const listId = sanitizeId(id);

  const listItem = await listItemStore.get({
    id: listId,
    tenantId,
  });

  if (listItem.archived) {
    return;
  }

  return fromCourierObject(listItem);
};

export const list: ListFn = async (tenantId, options) => {
  try {
    if (options?.pattern) {
      return findByPattern(tenantId, options);
    }

    const { lastEvaluatedKey, objects } = await listItemStore.list({
      exclusiveStartKey: options?.exclusiveStartKey,
      tenantId,
    });

    return {
      items: objects.map(fromCourierObject),
      lastEvaluatedKey,
    };
  } catch (error) {
    throw new UnavailableSendError(error, {
      tenantId,
      pattern: options?.pattern,
    });
  }
};

export const put: PutFn = async (tenantId, userId, listItem) => {
  try {
    assertValidListId(listItem.id);

    const id = sanitizeId(listItem.id);
    const user = userId ?? `tenant/${tenantId}`;
    const timestamp = Date.now();

    const updateExpressions = [
      "#created = if_not_exists(#created, :created)",
      "#creator = if_not_exists(#creator, :creator)",
      "#json = :json",
      "#objtype = if_not_exists(#objtype, :objtype)",
      "#subscriptionPointer = if_not_exists(#subscriptionPointer, :subscriptionPointer)",
      "#title = :title",
      "#updated = :updated",
      "#updater = :updater",
    ];

    const response = await dynamodb.update({
      ConditionExpression: "attribute_not_exists(#archived)",
      ExpressionAttributeNames: {
        "#archived": "archived",
        "#created": "created",
        "#creator": "creator",
        "#json": "json",
        "#objtype": "objtype",
        "#subscriptionPointer": "subscriptionPointer",
        "#title": "title",
        "#updated": "updated",
        "#updater": "updater",
      },
      ExpressionAttributeValues: {
        ":created": timestamp,
        ":creator": user,
        ":json": { preferences: listItem.preferences },
        ":objtype": objtype,
        ":subscriptionPointer": new Date().toISOString(),
        ":title": listItem.name ?? "",
        ":updated": timestamp,
        ":updater": user,
      },
      Key: { id: scopeId(id), tenantId },
      ReturnValues: "ALL_NEW",
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    });

    const { created, updated } = response.Attributes;

    // only create pattern records on list creation
    if (created === updated) {
      await patterns.createPatterns(tenantId, userId, id);
    }
  } catch (err) {
    if (err?.code === "ConditionalCheckFailedException") {
      throw new ListItemArchivedError();
    }

    throw err;
  }
};

export const restore: RestoreFn = async (tenantId, userId, id) => {
  const listId = sanitizeId(id);
  try {
    await listItemStore.restore({ id: listId, tenantId, userId });
  } catch (err) {
    if (err?.code === "ConditionalCheckFailedException") {
      throw new ListItemNotFoundError();
    }

    throw err;
  }
};

export const getSubscriptions: GetSubscriptionsFn = async (
  tenantId,
  id,
  options
) => {
  const relationship = await getSubscriptionPointer(tenantId, id);
  const response = await related(tenantId, id, relationship, options);

  return {
    items: response.items.map((item) => {
      const [, recipientId] = item.id.match(
        /^list\/.*\/subscription\/(?:.*\/)?(.*)$/
      );
      return {
        created: item.created,
        creator: item.creator,
        json: cleanNotificationPreferences(item.json),
        recipientId,
        updated: item.updated,
        updater: item.updater,
      };
    }),
    lastEvaluatedKey: response.lastEvaluatedKey,
  };
};

export const getSubscription: GetSubscriptionFn = async (
  tenantId,
  listId,
  recipientId
) => {
  const relationship = await getSubscriptionPointer(tenantId, listId);
  const subscriptionId = `${sanitizeId(listId)}/${relationship}/${recipientId}`;
  const response = await subscriptionStore.get({
    id: subscriptionId,
    tenantId,
  });
  return {
    created: response.created,
    creator: response.creator,
    json: response.json,
    recipientId,
    updated: response.updated,
    updater: response.updater,
  };
};

export const putSubscriptions: PutSubscriptionsFn = async (
  tenantId,
  userId,
  id,
  recipients
) => {
  const pointer = createSubscriptionPointer();

  // auto create new list and subscribe recipient when
  // list does not exist
  await put(tenantId, userId, { id });

  if (recipients?.length) {
    await subscriptionStore.batchCreate(
      {
        tenantId,
        userId,
      },
      recipients.map(({ recipientId, preferences = {} }) => ({
        id: `${id}/subscription/${pointer}/${decodeURI(recipientId)}`,
        json: {
          preferences,
        },
      }))
    );
  }
  await setSubscriptionPointer(tenantId, userId, id, pointer);
};

export const subscribe: SubscribeFn = async (
  tenantId,
  userId,
  id,
  recipientId,
  preferences
) => {
  const createSubscription = async () => {
    const relationship = await getSubscriptionPointer(tenantId, id);
    const subscriptionId = `${sanitizeId(id)}/${relationship}/${recipientId}`;
    await subscriptionStore.replace(
      { id: subscriptionId, tenantId, userId },
      {
        json: { preferences },
        title: undefined,
      },
      {
        serialize: false,
      }
    );
  };

  try {
    await createSubscription();
  } catch (e) {
    if (e instanceof NotFoundError) {
      // auto create new list and subscribe recipient when
      // list does not exist
      await put(tenantId, userId, { id });
      await createSubscription();
    } else {
      throw e;
    }
  }
};

export const unsubscribe: UnsubscribeFn = async (tenantId, id, recipientId) => {
  const relationship = await getSubscriptionPointer(tenantId, id);
  const subscriptionId = `${sanitizeId(id)}/${relationship}/${recipientId}`;
  await subscriptionStore.remove({ id: subscriptionId, tenantId });
};
