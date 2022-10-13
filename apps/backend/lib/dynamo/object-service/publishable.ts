import toDate from "date-fns/toDate";
import makeError from "make-error";

import chunkArray from "~/lib/chunk-array";

import dynamoDbObjectService from ".";
import * as dynamoDb from "..";
import fromAttributeMap from "../from-attribute-map";
import getTableName, { TABLE_NAMES } from "../tablenames";
import {
  ICreatePublishableFn,
  IDynamoDbObjectService,
  IDynamoDbPublishableObjectService,
  IGetFn,
  IGetLatestVersionFn,
  IGetVersionFn,
  IListAllVersionsFn,
  IListVersionsFn,
  IPublishableObject,
  IPublishableOptions,
  IPublishFn,
  IRemoveFn,
  IReplacePublishableFn,
} from "./types";

export const MoreRecentVersionExistsError = makeError(
  "MoreRecentVersionExistsError"
);
export const ObjectAlreadyExistsError = makeError("ObjectAlreadyExistsError");
export const ObjectNotPublishedError = makeError("ObjectNotPublishedError");

const TableName = getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME);

const createVersion = (date?: Date | number) => {
  if (!date) {
    return new Date().toISOString();
  }
  return toDate(date).toISOString();
};

const publishableObjectService = <T>(
  objtype: string,
  options: IPublishableOptions = {}
): IDynamoDbPublishableObjectService<T> => {
  const objectService: IDynamoDbObjectService<T> =
    dynamoDbObjectService(objtype);
  const versionObjType = `${objtype}:version`;
  const versionService: IDynamoDbObjectService<T> =
    dynamoDbObjectService(versionObjType);

  const scopeId = (id: string) => {
    if (!options.useScopedId) {
      return id;
    }

    return id.indexOf(`${objtype}/`) !== 0 ? `${objtype}/${id}` : id;
  };

  const create: ICreatePublishableFn<T, IPublishableObject<T>> = async (
    params,
    object,
    opts = {}
  ) => {
    const { tenantId, userId } = params;

    const id = scopeId(
      object.id ? encodeURIComponent(object.id) : dynamoDb.id()
    );
    const { json, sourceTimestamp, title } = object;

    const currentTimestamp = Date.now();
    const version = createVersion(currentTimestamp);
    const timestamp = sourceTimestamp ?? currentTimestamp;

    const item: IPublishableObject<T> = {
      created: timestamp,
      creator: userId,
      id,
      json,
      objtype,
      published: opts.publish ? currentTimestamp : undefined,
      tenantId,
      title,
      updated: timestamp,
      updater: userId,
      version,
    };

    const objectItem = { ...item, json: JSON.stringify(item.json) };

    const versionItem = {
      ...objectItem,
      id: `${item.id}/version/${version}`,
      objtype: versionObjType,
    };

    try {
      await dynamoDb.transactWrite({
        TransactItems: [
          {
            Put: {
              ConditionExpression: "attribute_not_exists(id)",
              Item: objectItem,
              TableName,
            },
          },
          {
            Put: {
              Item: versionItem,
              TableName,
            },
          },
        ],
      });
    } catch (err) {
      if (
        err &&
        err.code === "TransactionCanceledException" &&
        err.message.indexOf("ConditionalCheckFailed") > -1
      ) {
        throw new ObjectAlreadyExistsError(`${params.id} already exists`);
      }
      throw err;
    }

    return item;
  };

  const get: IGetFn<T, IPublishableObject<T>> = async (params) => {
    const { tenantId } = params;
    const id = scopeId(params.id);

    const object = (await objectService.get({
      id,
      tenantId,
    })) as IPublishableObject<T>;

    return object;
  };

  const getLatestVersion: IGetLatestVersionFn<T> = async (
    tenantId,
    objectId
  ) => {
    const id = scopeId(objectId);
    const versions = await listVersions(tenantId, id);
    return versions.items[0];
  };

  const getVersion: IGetVersionFn<T> = async (tenantId, objectId, version) => {
    const id = options.useScopedId
      ? `${objtype}/${objectId}/version/${version}`
      : `${objectId}/version/${version}`;

    const object = await versionService.get({ id, tenantId });
    return object as IPublishableObject<T>;
  };

  const listVersions: IListVersionsFn<T> = async (
    tenantId,
    objectId,
    opts = {}
  ) => {
    const id = scopeId(objectId);

    const results = await dynamoDb.query({
      ExclusiveStartKey: opts.exclusiveStartKey,
      ExpressionAttributeValues: {
        ":beginsWith": `${id}/version/`,
        ":tenantId": tenantId,
      },
      KeyConditionExpression:
        "begins_with(id, :beginsWith) AND tenantId = :tenantId",
      ScanIndexForward: false,
      TableName,
    });

    const items = results.Items.map((item) =>
      fromAttributeMap<IPublishableObject<T>>(item)
    );

    return {
      items,
      lastEvaluatedKey: results.LastEvaluatedKey,
    };
  };

  const listAllVersions: IListAllVersionsFn<T> = async (
    tenantId,
    objectId,
    opts
  ) => {
    const versions = await listVersions(tenantId, objectId, opts);

    if (!versions.lastEvaluatedKey) {
      return versions.items;
    }

    return [
      ...versions.items,
      ...(await listAllVersions(tenantId, objectId, {
        exclusiveStartKey: versions.lastEvaluatedKey,
      })),
    ];
  };

  const publish: IPublishFn = async (params, version) => {
    const { tenantId, userId } = params;
    const id = scopeId(params.id);
    const latest = await getLatestVersion(tenantId, id);

    if (latest.version !== version) {
      throw new MoreRecentVersionExistsError(
        `Detected a more recent version: ${latest.version}.`
      );
    }

    const published = Date.now();

    await dynamoDb.transactWrite({
      TransactItems: [
        {
          Update: {
            // update the version record to mark it as published
            ExpressionAttributeValues: {
              ":published": published,
              ":updated": published,
              ":updater": userId,
            },
            Key: {
              id: latest.id,
              tenantId: latest.tenantId,
            },
            TableName,
            UpdateExpression:
              "set published = :published, updated = :updated, updater = :updater",
          },
        },
        {
          Update: {
            // update the core object with the new version
            ExpressionAttributeValues: {
              ":json": JSON.stringify(latest.json),
              ":published": published,
              ":title": latest.title,
              ":updated": published,
              ":updater": userId,
              ":version": latest.version,
            },
            Key: {
              id,
              tenantId,
            },
            TableName,
            UpdateExpression:
              "set json = :json, published = :published, title = :title, updated = :updated, updater = :updater, version = :version",
          },
        },
      ],
    });

    return published;
  };

  const remove: IRemoveFn<T> = async (params) => {
    const { tenantId } = params;
    const id = scopeId(params.id);

    await objectService.remove({ id, tenantId });

    const versions = await listAllVersions(tenantId, id);
    for (const chunk of chunkArray<IPublishableObject<T>>(versions)) {
      await dynamoDb.transactWrite({
        TransactItems: chunk.map((item) => ({
          Delete: {
            Key: { id: item.id, tenantId },
            TableName,
          },
        })),
      });
    }

    return {};
  };

  const replace: IReplacePublishableFn<IPublishableObject<T>> = async (
    params,
    object,
    opts = {}
  ) => {
    const { tenantId, userId } = params;
    const id = scopeId(params.id);

    const { json, sourceTimestamp, title } = object;
    const currentTimestamp = Date.now();
    const version = createVersion(currentTimestamp);
    const timestamp = sourceTimestamp ?? currentTimestamp;

    const item: IPublishableObject<T> = {
      created: timestamp,
      creator: userId,
      id: `${id}/version/${version}`,
      json,
      objtype: versionObjType,
      published: opts.publish ? currentTimestamp : undefined,
      tenantId,
      title,
      updated: timestamp,
      updater: userId,
      version,
    };

    const objectItem = { ...item, json: JSON.stringify(item.json) };

    const transactItems = [];

    transactItems.push({
      // create a new version entry
      Put: {
        ConditionExpression: "attribute_not_exists(id)",
        Item: objectItem,
        TableName,
      },
    });

    if (opts.publish) {
      transactItems.push({
        // update the core object with the new version
        Update: {
          ExpressionAttributeValues: {
            ":json": objectItem.json,
            ":published": currentTimestamp,
            ":title": objectItem.title,
            ":updated": currentTimestamp,
            ":updater": userId,
            ":version": objectItem.version,
          },
          Key: { id, tenantId },
          TableName,
          UpdateExpression:
            "set json = :json, published = :published, title = :title, updated = :updated, updater = :updater, version = :version",
        },
      });
    }

    await dynamoDb.transactWrite({ TransactItems: transactItems });
    return item;
  };

  return {
    count: objectService.count,
    create,
    get,
    getLatestVersion,
    getVersion,
    list: objectService.list,
    listAllVersions,
    listVersions,
    publish,
    remove,
    replace,
  };
};

export default publishableObjectService;
