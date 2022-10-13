import uuidv4 from "uuid/v4";
import {
  emitApiKeyCreatedEvent,
  emitApiKeyDeletedEvent,
} from "~/auditing/services/emit";
import { TenantRouting, TenantScope } from "~/types.internal";
import { toApiKey } from "../api-key-uuid";
import {
  defaultScopes,
  publishedProductionScope,
} from "../tenant-service/token-scopes";
import { deleteItem, getItem, put, query, update } from "./index";

import getTableName, { TABLE_NAMES } from "./tablenames";

export interface ITenantAuthToken {
  tenantId: string;
  authToken: string;
  apiKey?: string;
  archived?: number;
  created: number;
  creator: string;
  name?: string;
  scope: TenantScope;
  dryRunKey?: TenantRouting;
}

export const createKey = async (
  scope: TenantScope,
  tenantId: string,
  user: { email: string; id: string },
  name?: string,
  dryRunKey?: TenantRouting
): Promise<void> => {
  const timestamp = new Date();
  const created = timestamp.getTime();
  const prefix = defaultScopes.get(scope) || publishedProductionScope;
  const [authTokenDetails] = await queryByTenantId(tenantId);

  await put({
    Item: {
      apiKey: authTokenDetails?.apiKey,
      authToken: `${prefix}${toApiKey(uuidv4())}`,
      created,
      creator: user.id,
      scope,
      tenantId,
      name,
      dryRunKey,
    },
    TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
  });

  await emitApiKeyCreatedEvent(scope, timestamp, user, tenantId);
};

export const deleteKey = async (
  apiKey: string,
  tenantId: string,
  user: { email: string; id: string }
): Promise<void> => {
  const timestamp = new Date();
  const { Attributes: tenantAuthToken } = await deleteItem({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    ConditionExpression: "tenantId = :tenantId",
    Key: {
      authToken: apiKey,
    },
    TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
    ReturnValues: "ALL_OLD",
  });

  await emitApiKeyDeletedEvent(
    tenantAuthToken.scope as TenantScope,
    timestamp,
    user,
    tenantId
  );
};

export const getKey = async (
  authToken: string
): Promise<ITenantAuthToken | null> => {
  const authTokenObj = await getItem({
    Key: {
      authToken,
    },
    TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
  });

  if (!authTokenObj || !authTokenObj.Item || authTokenObj.Item.archived) {
    return null;
  }

  return authTokenObj.Item as ITenantAuthToken;
};

export const archiveKey = async (
  authToken: string,
  tenantId: string
): Promise<void> => {
  await update({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
      ":archived": Date.now(),
    },
    ConditionExpression: "tenantId = :tenantId",
    UpdateExpression: "SET archived = :archived ",
    Key: {
      authToken,
    },
    TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
  });
};

export const queryByTenantId = async (
  tenantId: string
): Promise<ITenantAuthToken[] | null> => {
  const result = await query({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    IndexName: "by-tenant-index",
    KeyConditionExpression: "tenantId = :tenantId",
    TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
  });

  if (!result || !result.Items) {
    return null;
  }

  return result.Items as ITenantAuthToken[];
};
