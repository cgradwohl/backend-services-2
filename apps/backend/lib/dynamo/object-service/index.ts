import { AttributeMap } from "aws-sdk/clients/dynamodb";
import makeError from "make-error";

import { NotFound } from "~/lib/http-errors";
import logger from "~/lib/logger";
import * as Types from "~/types.api";
import * as dynamodb from "..";
import getTableName, { TABLE_NAMES } from "../tablenames";
import {
  IArchiveFn,
  IBatchCreateFn,
  IBatchDeleteFn,
  IBatchGetFn,
  ICountFn,
  ICreateFn,
  IDuplicateFn,
  IDynamoDbObjectService,
  IGetFn,
  IListFn,
  IRemoveFn,
  IReplaceFn,
  IRestoreFn,
} from "./types";

export const ObjectAlreadyExistsError = makeError("ObjectAlreadyExistsError");

const fromAttributeMap = <T>(obj: AttributeMap): T => {
  let json = obj.json as T;

  try {
    if (typeof json === "string") {
      json = JSON.parse(json);
    }
  } catch {
    // do nothing
  }

  return ({
    ...obj,
    json,
  } as unknown) as T;
};

const dynamoDbObjectService = <T>(
  objtype: string,
  options?: {
    idScope?: string;
    useScopedId: boolean;
  }
): IDynamoDbObjectService<T> => {
  const getUpdater = (userId: string, tenantId: string) => {
    return userId || `tenant/${tenantId}`;
  };

  const scopeId = (id: string) => {
    if (!options?.useScopedId) {
      return id;
    }

    const scope = options?.idScope ?? objtype;
    return id.indexOf(`${scope}/`) !== 0 ? `${scope}/${id}` : id;
  };

  const archive: IArchiveFn<T> = async ({ id, tenantId, userId }) => {
    const Key = {
      id: scopeId(id),
      tenantId,
    };

    await dynamodb.update({
      ConditionExpression: "attribute_exists(id)",
      ExpressionAttributeValues: {
        ":archived": true,
        ":updated": new Date().getTime(),
        ":updater": getUpdater(userId, tenantId),
      },
      Key,
      ReturnValues: "NONE",
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
      UpdateExpression:
        "set archived = :archived, updated = :updated, updater = :updater",
    });
  };

  const batchDelete: IBatchDeleteFn = async ({ tenantId }, ids) => {
    const TableName = getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME);

    const batches: string[][] = [];
    const uniqueIds: ReadonlySet<string> = new Set(ids);

    // batch writes can only do up to 25 items at a time
    for (let i = 0; i < uniqueIds.size; i += 25) {
      batches.push([...uniqueIds].slice(i, i + 25));
    }

    await Promise.all(
      batches.map(async (batch) => {
        return dynamodb.batchWrite({
          RequestItems: {
            [TableName]: batch.map((id) => {
              const scopedId = scopeId(id);
              return {
                DeleteRequest: {
                  Key: { id: scopedId, tenantId },
                },
              };
            }),
          },
        });
      })
    );
  };

  const batchGet: IBatchGetFn<T> = async ({ configurationIds, tenantId }) => {
    const TableName = getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME);
    // get configurations from strategy
    const configurationsRes = await dynamodb.batchGet({
      RequestItems: {
        [TableName]: {
          Keys: configurationIds.map((id: string) => ({
            id: scopeId(id),
            tenantId,
          })),
        },
      },
      ReturnConsumedCapacity: "TOTAL",
    });
    logger.debug(
      `consumedCapacity for batchGetConfigurations:- ${configurationsRes?.ConsumedCapacity?.reduce(
        (prev, c) => prev + c?.CapacityUnits,
        0
      )}`
    );
    const responses = configurationsRes.Responses[TableName];
    return responses.map((obj) => fromAttributeMap(obj));
  };

  const count: ICountFn<T> = async ({ archived, strategyId, tenantId }) => {
    const strategyIdFilter = objtype === "event" && strategyId;

    const FilterExpression = [
      !archived ? "archived <> :true" : undefined,
      strategyIdFilter ? "json.strategyId = :strategyId" : undefined,
    ]
      .filter((exp) => exp)
      .join(" AND ");

    const results = await dynamodb.query({
      ExpressionAttributeValues: {
        ":objtype": objtype,
        ":strategyId": strategyId,
        ":tenantId": tenantId,
        ":true": true,
      },
      FilterExpression,
      IndexName: "by-objtype-index",
      KeyConditionExpression: "tenantId = :tenantId AND objtype = :objtype",
      // Limit: 1, // sadly this doesn't work because dynamodb limits before the filter expression
      Select: "COUNT",
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
    });

    return results.Count;
  };

  const batchCreate: IBatchCreateFn<T> = async (
    { tenantId, userId },
    objects: Array<Types.CourierObject<T>>
  ) => {
    userId = userId ?? `tenant/${tenantId}`;
    const batches = [];

    // batch writes can only do up to 25 items at a time
    for (let i = 0; i < objects.length; i += 25) {
      batches.push(objects.slice(i, i + 25));
    }

    return Promise.all(
      batches.map(async (batch) => {
        return dynamodb.batchWrite({
          RequestItems: {
            [getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME)]: batch.map(
              (object) => {
                const id = scopeId(object.id);
                return {
                  PutRequest: {
                    Item: {
                      ...object,
                      created: new Date().getTime(),
                      creator: userId,
                      id,
                      objtype,
                      tenantId,
                      updated: new Date().getTime(),
                      updater: userId,
                    },
                  },
                };
              }
            ),
          },
        });
      })
    );
  };

  const create: ICreateFn<T> = async (
    { tenantId, userId },
    object: Types.CourierObject<T>,
    { serialize } = { serialize: true }
  ) => {
    userId = getUpdater(userId, tenantId);
    const id = scopeId(object.id || dynamodb.id());
    const currentTimestamp = new Date().getTime();

    const ConditionExpression = object.id
      ? "attribute_not_exists(id)"
      : undefined;

    const item: Types.CourierObject<T> = {
      created: object.sourceTimestamp ?? currentTimestamp,
      creator: userId,
      id,
      json: object.json,
      objtype,
      tenantId,
      title: object.title,
      updated: object.sourceTimestamp ?? currentTimestamp,
      updater: userId,
    };

    try {
      await dynamodb.put({
        ConditionExpression,
        Item: {
          ...item,
          json: serialize ? JSON.stringify(object.json) : object.json,
        },
        TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
      });
    } catch (err) {
      if (err && err.code === "ConditionalCheckFailedException") {
        throw new ObjectAlreadyExistsError(`${object.id} already exists`);
      }
      throw err;
    }

    return item as Types.CourierObject<T>;
  };

  const duplicate: IDuplicateFn<T> = async ({ id, tenantId, userId }) => {
    userId = getUpdater(userId, tenantId);
    const item = await get({ id, tenantId });

    let duplicatedItem: Types.CourierObject<T> = {
      created: new Date().getTime(),
      creator: userId,
      id: scopeId(dynamodb.id()),
      json: item.json,
      objtype,
      tenantId,
      title: `${item.title} COPY`,
      updated: new Date().getTime(),
      updater: userId,
    };

    await dynamodb.put({
      Item: duplicatedItem,
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
    });

    if (typeof duplicatedItem.json === "string") {
      try {
        duplicatedItem = {
          ...duplicatedItem,
          json: JSON.parse(duplicatedItem.json),
        };
      } catch {
        // do nothing
      }
    }

    return duplicatedItem;
  };

  const get: IGetFn<T> = async ({ id, tenantId }) => {
    const Key = {
      id: scopeId(id),
      tenantId,
    };

    const response = await dynamodb.getItem({
      Key,
      ReturnConsumedCapacity: "TOTAL",
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
    });

    if (!response || !response.Item || response.Item.objtype !== objtype) {
      throw new NotFound("Item not found");
    }

    logger.debug(
      `consumedCapacity for ${Key.id}:- ${response?.ConsumedCapacity?.CapacityUnits}`
    );

    let item = response.Item;

    if (typeof item.json === "string") {
      try {
        item = {
          ...item,
          json: JSON.parse(item.json),
        };
      } catch {
        // do nothing
      }
    }

    return item as Types.CourierObject<T>;
  };

  const list: IListFn<T> = async ({
    archived,
    exclusiveStartKey,
    ExpressionAttributeValues = {},
    FilterExpression = "",
    ignoreArchived,
    Limit = 0,
    tenantId,
  }) => {
    let FE = ignoreArchived
      ? ""
      : !archived
      ? "archived <> :true"
      : "archived = :true";

    if (FilterExpression) {
      FE += FE.length ? ` AND ${FilterExpression}` : FilterExpression;
    }

    const queryNoLimit = {
      ExclusiveStartKey: exclusiveStartKey,
      ExpressionAttributeValues: {
        ":objtype": objtype,
        ":tenantId": tenantId,
        ":true": ignoreArchived ? undefined : true,
        ...ExpressionAttributeValues,
      },
      FilterExpression: FE,
      IndexName: "by-objtype-index",
      KeyConditionExpression: "tenantId = :tenantId AND objtype = :objtype",
      ReturnConsumedCapacity: "TOTAL",
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
    };

    // conditionally add Limit as a value of 0 is not permissible
    const query = Limit > 0 ? { ...queryNoLimit, Limit } : queryNoLimit;

    const results = await dynamodb.query(query);

    logger.debug(
      `consumedCapacity for ${"Listing" + objtype}:- ${
        results.ConsumedCapacity?.CapacityUnits
      }`
    );

    const objects: Array<Types.CourierObject<T>> = results.Items.map((item) =>
      fromAttributeMap(item)
    );
    return { lastEvaluatedKey: results.LastEvaluatedKey, objects };
  };

  const remove: IRemoveFn<T> = async ({ id, tenantId }) => {
    const scopedId = scopeId(id);
    await get({ id, tenantId });

    await dynamodb.deleteItem({
      Key: {
        id: scopedId,
        tenantId,
      },
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
    });

    return {};
  };

  const replace: IReplaceFn<T> = async (
    { id, tenantId, userId },
    object: {
      updated?: number;
      json: T;
      title: string;
      archived?: boolean;
      sourceTimestamp?: number;
    },
    { query, serialize } = { query: {}, serialize: true }
  ) => {
    userId = getUpdater(userId, tenantId);
    const currentTimestamp = new Date().getTime();

    const setExpressions = [
      "archived = :archived",
      "json = :json",
      "objtype = if_not_exists(objtype, :objtype)",
      "created = :created",
      "creator = if_not_exists(creator, :creator)",
      "updated = :updated",
      "updater = :updater",
    ];

    await dynamodb.update({
      ...query,
      ExpressionAttributeValues: {
        ":archived": object.archived ?? false,
        ":created": object.sourceTimestamp ?? currentTimestamp,
        ":creator": userId,
        ":json": serialize ? JSON.stringify(object.json) : object.json,
        ":objtype": objtype,
        ":title": object.title,
        ":updated": object.sourceTimestamp ?? currentTimestamp,
        ":updater": userId,
      },
      Key: {
        id: scopeId(id),
        tenantId,
      },
      ReturnValues: "ALL_NEW",
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
      UpdateExpression: `set ${
        object.title ? "title = :title, " : ""
      }${setExpressions.join(", ")}`,
    });

    return {
      json: object.json,
      title: object.title,
    };
  };

  const restore: IRestoreFn = async ({ id, tenantId, userId }) => {
    const Key = {
      id: scopeId(id),
      tenantId,
    };

    await dynamodb.update({
      ConditionExpression: "attribute_exists(id)",
      ExpressionAttributeValues: {
        ":updated": new Date().getTime(),
        ":updater": getUpdater(userId, tenantId),
      },
      Key,
      ReturnValues: "NONE",
      TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
      UpdateExpression:
        "REMOVE archived SET updated = :updated, updater = :updater",
    });
  };

  return {
    archive,
    batchCreate,
    batchDelete,
    batchGet,
    count,
    create,
    duplicate,
    get,
    list,
    remove,
    replace,
    restore,
  };
};

export default dynamoDbObjectService;
