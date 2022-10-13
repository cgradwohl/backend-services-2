import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as dynamodb from "..";
import fromAttributeMap from "../from-attribute-map";
import {
  IBatchGetFn,
  ICreateFn,
  IDynamoStoreService,
  IGetFn,
  IListFn,
  IRemoveFn,
  IScanFn,
  IUpdateFn,
} from "./types";

const dynamoStoreService = <T, K extends DocumentClient.Key>(
  tableName: string
): IDynamoStoreService<T, K> => {
  const batchGet: IBatchGetFn<T, K> = async (...keys) => {
    const { Responses } = await dynamodb.batchGet({
      RequestItems: {
        [tableName]: {
          Keys: keys,
        },
      },
    });
    return Responses[tableName].map(obj => fromAttributeMap(obj));
  };

  const create: ICreateFn<T> = async item => {
    const query = create.query(item);
    await dynamodb.put(query);
    return item;
  };

  create.query = item => ({
    Item: item,
    TableName: tableName,
  });

  create.asTransactionItem = item => ({
    Put: create.query(item),
  });

  const get: IGetFn<T, K> = async key => {
    const item = await dynamodb.getItem(get.query(key));
    return item.Item as T;
  };

  get.query = key => ({
    Key: key,
    TableName: tableName,
  });

  const list: IListFn<T> = async query => {
    const items = await dynamodb.query(list.query(query));

    return {
      items: items.Items as T[],
      lastEvaluatedKey: items.LastEvaluatedKey,
    };
  };

  list.query = query => ({
    ...query,
    TableName: tableName,
  });

  const remove: IRemoveFn<K> = async key => {
    await dynamodb.deleteItem(remove.query(key));
  };

  remove.query = key => ({
    Key: key,
    TableName: tableName,
  });

  remove.asTransactionItem = key => ({
    Delete: remove.query(key),
  });

  const scan: IScanFn<T> = async query => {
    const items = await dynamodb.scan(scan.query(query));

    return {
      items: items.Items as T[],
      lastEvaluatedKey: items.LastEvaluatedKey,
    };
  };

  scan.query = query => ({
    ...query,
    TableName: tableName,
  });

  const update: IUpdateFn<T, K> = async (key, updates) => {
    const item = await dynamodb.update(update.query(key, updates));
    return item.Attributes as Partial<T>;
  };

  update.query = (key, updates) => {
    const keys = Object.keys(updates);

    /*
      One or more substitution tokens for attribute names in an expression.
      The following are some use cases for using ExpressionAttributeNames:
        * To access an attribute whose name conflicts with a DynamoDB reserved word.
        * To create a placeholder for repeating occurrences of an attribute name in an expression.
        * To prevent special characters in an attribute name from being misinterpreted in an expression.
    */
    const expressionAttributeNames = keys.reduce((acc, k) => {
      if (updates[k] === null || updates[k] === undefined) {
        return acc;
      }

      return { ...acc, [`#${k}`]: k };
    }, {});

    /*
      One or more values that can be substituted in an expression
    */
    const expressionAttributeValues = keys.reduce((acc, k) => {
      if (updates[k] === null || updates[k] === undefined) {
        return acc;
      }

      return { ...acc, [`:${k}`]: updates[k] };
    }, {});

    const setExpressions = keys.reduce((acc, k) => {
      return updates[k] !== null && updates[k] !== undefined
        ? [...acc, `#${k} = :${k}`]
        : acc;
    }, []);

    const setExpression = setExpressions.length
      ? `SET ${setExpressions.join(", ")}`
      : "";

    const removeExpressions = keys.reduce((acc, k) => {
      return updates[k] === null || updates[k] === undefined
        ? [...acc, k]
        : acc;
    }, []);

    const removeExpression = removeExpressions.length
      ? `REMOVE ${removeExpressions.join(", ")}`
      : "";

    /*
      An expression that defines one or more attributes to be updated,
      the action to be performed on them, and new values for them.
    */
    const updateExpression = `${setExpression} ${removeExpression}`.trim();

    return {
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length
        ? expressionAttributeNames
        : null,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length
        ? expressionAttributeValues
        : null,
      Key: key,
      TableName: tableName,
      UpdateExpression: updateExpression,
    };
  };

  update.asTransactionItem = (key, updates) => ({
    Update: update.query(key, updates) as DocumentClient.Update,
  });

  return {
    batchGet,
    create,
    dynamodb,
    get,
    list,
    remove,
    scan,
    update,
  };
};

export default dynamoStoreService;
