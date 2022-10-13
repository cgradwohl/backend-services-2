import * as dynamodb from "..";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface IBatchGetFn<T, K> {
  (...keys: Array<K>): Promise<T[]>;
}

export interface ICreateFn<T> {
  (item: T): Promise<T>;
  query(item: T): DocumentClient.PutItemInput;
  asTransactionItem(item: T): DocumentClient.TransactWriteItem;
}

export interface IDynamoStoreService<T, K extends DocumentClient.Key> {
  batchGet: IBatchGetFn<T, K>;
  create: ICreateFn<T>;
  dynamodb: typeof dynamodb;
  get: IGetFn<T, K>;
  list: IListFn<T>;
  remove: IRemoveFn<K>;
  scan: IScanFn<T>;
  update: IUpdateFn<T, K>;
}

export interface IGetFn<T, K extends DocumentClient.Key> {
  (key: K): Promise<T>;
  query(key: K): DocumentClient.GetItemInput;
}

export interface IListFnResponse<T> {
  lastEvaluatedKey?: DocumentClient.Key;
  items: T[];
}

export interface IListFn<T> {
  (query: Partial<DocumentClient.QueryInput>): Promise<IListFnResponse<T>>;
  query(query: Partial<DocumentClient.QueryInput>): DocumentClient.QueryInput;
}

export interface IRemoveFn<K extends DocumentClient.Key> {
  (key: K): Promise<void>;
  query(key: K): DocumentClient.DeleteItemInput;
  asTransactionItem(key: K): DocumentClient.TransactWriteItem;
}

export interface IScanFnResponse<T> {
  lastEvaluatedKey?: DocumentClient.Key;
  items: T[];
}

export interface IScanFn<T> {
  (query?: Partial<DocumentClient.ScanInput>): Promise<IScanFnResponse<T>>;
  query(query?: Partial<DocumentClient.ScanInput>): DocumentClient.ScanInput;
}

export interface IUpdateFn<T, K extends DocumentClient.Key> {
  (key: K, item: Partial<T>): Promise<Partial<T>>;
  query(key: K, item: Partial<T>): DocumentClient.UpdateItemInput;
  asTransactionItem(key: K, item: Partial<T>): DocumentClient.TransactWriteItem;
}
