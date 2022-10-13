import { ITag } from "~/types.api";

import dynamoStoreService from "../dynamo/store-service";
import { ITagKey } from "./types";
import * as dynamodb from "../dynamo";

const TableName = process.env.TAGS_TABLE_NAME;

const service = dynamoStoreService<ITag, ITagKey>(TableName);

export interface ICreateTagFn<ITag> {
  (tag: ITag): Promise<ITag>;
}

export interface IListTagFn<ITag> {
  (params: { tenantId: string }): Promise<{
    tags: Array<ITag>;
  }>;
}

// export const create = service.create;
export const create: ICreateTagFn<ITag> = async (tag: ITag) => {
  const item: ITag = {
    created: Date.now(),
    id: tag.id ?? dynamodb.id(),
    tenantId: tag.tenantId,
    label: tag.label,
    color: tag.color,
  };

  await dynamodb.put({
    Item: item,
    TableName,
  });

  return item as ITag;
};

export const get = service.get;
export const list: IListTagFn<ITag> = async (tenantId) => {
  const results = await dynamodb.query({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    KeyConditionExpression: "tenantId = :tenantId",
    TableName,
  });

  const tags: Array<ITag> = results.Items.map((item) => ({
    created: item.created,
    id: item.id,
    tenantId: item.tenantId,
    label: item.label,
    color: item.color,
  }));

  return { tags };
};

export const remove = service.remove;
export const scan = service.scan;
export const update = service.update;
