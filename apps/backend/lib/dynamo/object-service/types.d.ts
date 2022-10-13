import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CourierObject, CreateCourierObject } from "../../../types.api";

export interface IArchiveFn<T> {
  (params: { id: string; tenantId: string; userId?: string }): Promise<void>;
}

export interface IBatchDeleteFn {
  (params: { tenantId: string; userId?: string }, ids: string[]): Promise<void>;
}

export interface IBatchGetFn<T> {
  (params: { configurationIds: string[]; tenantId: string }): Promise<
    Array<CourierObject<T>>
  >;
}

export interface ICountFn<T> {
  (params: {
    archived?: boolean;
    strategyId?: string;
    tenantId: string;
  }): Promise<number>;
}

export interface IBatchCreateFn<T> {
  (
    params: {
      id?: string;
      tenantId: string;
      userId: string;
    },
    objects: Array<CreateCourierObject<T>>
  ): Promise<DocumentClient.BatchWriteItemOutput[]>;
}

export interface ICreateFn<T, K extends CourierObject = CourierObject<T>> {
  (
    params: {
      id?: string;
      tenantId: string;
      userId: string;
    },
    object: CreateCourierObject<T>,
    options?: {
      serialize: boolean;
    }
  ): Promise<K>;
}

export interface IUpsertFn<T, K extends CourierObject = CourierObject<T>> {
  (
    params: {
      id: string;
      tenantId: string;
      userId: string;
    },
    object: CreateCourierObject<T>,
    options?: {
      serialize: boolean;
    }
  ): Promise<K>;
}

export interface ICreatePublishableFn<T, K extends IPublishableObject<T>> {
  (
    params: {
      id?: string;
      tenantId: string;
      userId: string;
    },
    object: CreateCourierObject<T>,
    options?: { publish?: boolean }
  ): Promise<K>;
}

export interface IDuplicateFn<T> {
  (params: { id: string; tenantId: string; userId: string }): Promise<
    CourierObject<T>
  >;
}

export interface IDynamoDbObjectService<T> {
  archive: IArchiveFn<T>;
  batchDelete: IBatchDeleteFn;
  batchGet: IBatchGetFn<T>;
  batchCreate: IBatchCreateFn<T>;
  count: ICountFn<T>;
  create: ICreateFn<T>;
  duplicate: IDuplicateFn<T>;
  get: IGetFn<T>;
  list: IListFn<T>;
  remove: IRemoveFn<T>;
  replace: IReplaceFn<T>;
  restore: IRestoreFn;
}

export interface IDynamoDbPublishableObjectService<T> {
  count: ICountFn<T>;
  create: ICreatePublishableFn<T, IPublishableObject<T>>;
  get: IGetFn<T, IPublishableObject<T>>;
  getLatestVersion: IGetLatestVersionFn<T>;
  getVersion: IGetVersionFn<T>;
  listAllVersions: IListAllVersionsFn<T>;
  listVersions: IListVersionsFn<T>;
  list: IListFn<T>;
  publish: IPublishFn;
  remove: IRemoveFn<T>;
  replace: IReplacePublishableFn<IPublishableObject<T>>;
}

export interface IGetFn<T, K extends CourierObject = CourierObject<T>> {
  (params: { id: string; tenantId: string }): Promise<K>;
}

export interface IGetVersionFn<T> {
  (tenantId: string, objectId: string, version: string): Promise<
    IPublishableObject<T>
  >;
}

export interface IGetLatestVersionFn<T> {
  (tenantId: string, objectId: string): Promise<IPublishableObject<T>>;
}

export interface IListFn<T> {
  (params: {
    archived?: boolean;
    exclusiveStartKey?: DocumentClient.Key;
    ExpressionAttributeValues?: any;
    FilterExpression?: string;
    ignoreArchived?: true;
    Limit?: number;
    tenantId: string;
  }): Promise<{
    lastEvaluatedKey?: DocumentClient.Key;
    objects: Array<CourierObject<T>>;
  }>;
}

export interface IListAllVersionsFn<T> {
  (tenantId: string, objectId: string, options?: IPagedListOptions): Promise<
    IPublishableObject<T>[]
  >;
}

export interface IListVersionsFn<T> {
  (tenantId: string, objectId: string, options?: IPagedListOptions): Promise<{
    lastEvaluatedKey?: DocumentClient.Key;
    items: IPublishableObject<T>[];
  }>;
}

interface IPagedListOptions {
  exclusiveStartKey?: DocumentClient.Key;
}

export interface IPublishFn {
  (
    params: { id: string; tenantId: string; userId: string },
    version: string
  ): Promise<number>;
}

export interface IPublishableObject<T> extends CourierObject<T> {
  published?: number;
  version: string;
}

export interface IPublishableOptions {
  useScopedId?: boolean;
}

export interface IRemoveFn<T> {
  (params: { id: string; tenantId: string }): Promise<{}>;
}

export interface IReplaceFn<
  T,
  K = {
    json: T;
    title: string;
    updated?: number;
  }
> {
  (
    params: { id: string; tenantId: string; userId?: string },
    object: {
      json: any;
      sourceTimestamp?: number;
      title?: string;
      updated?: number;
    },
    opts?: {
      query?: Partial<DocumentClient.UpdateItemInput>;
      serialize: boolean;
    }
  ): Promise<K>;
}

export interface IReplacePublishableFn<T> {
  (
    params: { id: string; tenantId: string; userId: string },
    object: {
      json: any;
      sourceTimestamp?: number;
      title: string;
      updated?: number;
    },
    options?: { publish?: boolean }
  ): Promise<T>;
}

export interface IRestoreFn {
  (params: { id: string; tenantId: string; userId?: string }): Promise<void>;
}
