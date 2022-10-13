import { Update } from "aws-sdk/clients/dynamodb";
import { put } from "../dynamo";
import dynamoStoreService from "../dynamo/store-service";
import {
  ICreateSessionManagementFn,
  ISessionManagement,
  ISessionManagementKey,
} from "./types";

const TableName = process.env.SESSION_MANAGEMENT_TABLE;
const service = dynamoStoreService<ISessionManagement, ISessionManagementKey>(
  TableName
);

export const namespaceKeys = {
  JWT_SIGNATURE: "jwt-signature",
  PASSWORD_CHANGED: "username",
};
Object.freeze(namespaceKeys);

// ttl of +1 hour from update as jwts will be properly expired
// by cognito within 1 hour. guaranteed precision is not important
// in this use case.
export const create: ICreateSessionManagementFn<ISessionManagement> = async (
  data: ISessionManagement
) => {
  const item = {
    ...data,
    ttl: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  await put({
    Item: item,
    TableName,
  });
};

export const get = service.get;
