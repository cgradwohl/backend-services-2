import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CourierObject } from "~/types.api";
import { IProfilePreferences } from "~/types.public";

interface IPaged<T> {
  lastEvaluatedKey?: DocumentClient.Key;
  items: T[];
}

// dynamodb interface
// tslint:disable-next-line: no-empty-interface
export interface IDynamoListItemJson {
  // no additional data currently supported
}

// tslint:disable-next-line: no-empty-interface
export interface IDynamoListPatternJson {
  // no additional data currently supported
}

// tslint:disable-next-line: no-empty-interface
export interface IDynamoListSubscriptionJson {
  // no additional data currently supported
}

export interface IDynamoListItem extends CourierObject<IDynamoListItemJson> {
  subscriptionPointer?: string;
}

export interface IDynamoWriteListItem {
  id: string;
  json: {};
  objtype: "list";
  tenantId: string;
  title?: string;
}

export interface IDynamoListPatternJson
  extends CourierObject<IDynamoListPatternJson> {}

export interface IDynamoListSubscription
  extends CourierObject<IDynamoListSubscriptionJson> {}

// service interface
export interface IListItem {
  created: number;
  creator: string;
  id: string;
  name?: string;
  preferences?: IProfilePreferences;
  updated?: number;
  updater?: string;
}

export interface IWriteListItem {
  id: string;
  name?: string;
  preferences?: IProfilePreferences;
}

export interface IListItems extends IPaged<IListItem> {}

export interface IListItemSubscription {
  created: number;
  creator: string;
  json: { preferences?: IProfilePreferences };
  recipientId: string;
  updated?: number;
  updater?: string;
}

export interface IListItemSubscriptions {
  lastEvaluatedKey?: DocumentClient.Key;
  items: IListItemSubscription[];
}

// exported operations
export type ArchiveFn = (
  tenantId: string,
  userId: string,
  listId: string
) => Promise<void>;

export type GetFn = (tenantId: string, listId: string) => Promise<IListItem>;

interface IGetSubscriptionsOptions {
  exclusiveStartKey?: DocumentClient.Key;
  limit?: number;
}
export type GetSubscriptionsFn = (
  tenantId: string,
  id: string,
  options?: IGetSubscriptionsOptions
) => Promise<IListItemSubscriptions>;

export type GetSubscriptionFn = (
  tenantId: string,
  listId: string,
  recipientId: string
) => Promise<IListItemSubscription>;

interface IListOptions {
  exclusiveStartKey?: DocumentClient.Key;
  pattern?: string;
}
export type ListFn = (
  tenantId: string,
  options?: IListOptions
) => Promise<IListItems>;

export type PutFn = (
  tenantId: string,
  userId: string,
  listItem: IWriteListItem
) => Promise<void>;

export type PutSubscriptionsFn = (
  tenantId: string,
  userId: string,
  id: string,
  recipients: Array<{
    recipientId: string;
    preferences?: IProfilePreferences;
  }>
) => Promise<void>;

export type RestoreFn = (
  tenantId: string,
  userId: string,
  listId: string
) => Promise<void>;

export type SubscribeFn = (
  tenantId: string,
  userId: string,
  listId: string,
  recipientId: string,
  preferences?: IProfilePreferences
) => Promise<void>;

export type UnsubscribeFn = (
  tenantId: string,
  listId: string,
  recipientId: string
) => Promise<void>;

// ----------------------
// id-pattern definitions
// ----------------------

// export interface IIdPatternJson {
//   id: string;
//   type: string;
// }

// export type BatchCreateIdPatternsFn = (
//   objId: string,
//   objType: string,
//   tenantId: string,
//   userId: string
// ) => Promise<void>;

// export type BatchDeleteIdPatternsFn = (
//   objId: string,
//   objType: string,
//   tenantId: string
// ) => Promise<void>;

// export type BatchGetTopicMatchesFn = (
//   exclusiveStartKey: DocumentClient.Key,
//   pattern: string,
//   tenantId: string
// ) => Promise<{
//   items: string[];
//   lastEvaluatedKey: DocumentClient.Key;
// }>;
