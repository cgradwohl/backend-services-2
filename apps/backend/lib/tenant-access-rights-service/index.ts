import makeError from "make-error";

import * as dynamo from "../dynamo";
import dynamoStoreService from "../dynamo/store-service";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";

import { ITenantAccessRight, ITenantAccessRightKey, Role } from "./types";
import { getUser } from "../cognito";
import { emitUserRoleChangedEvent } from "~/auditing/services/emit";

const tableName = getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME);
const service = dynamoStoreService<ITenantAccessRight, ITenantAccessRightKey>(
  tableName
);

export const UserNotFoundError = makeError("UserNotFoundError");

export const create = service.create;
export const get = service.get;
export const remove = service.remove;

export const setRole = async (
  tenantId: string,
  userId: string,
  role: Role,
  requestedById?: string
) => {
  try {
    await dynamo.update({
      ConditionExpression:
        "attribute_exists(#tenantId) AND attribute_exists(#userId)",
      ExpressionAttributeNames: {
        "#role": "role",
        "#tenantId": "tenantId",
        "#userId": "userId",
      },
      ExpressionAttributeValues: {
        ":role": role,
      },
      Key: { tenantId, userId },
      TableName: tableName,
      UpdateExpression: "SET #role = :role",
    });

    // emit audit event
    let targetObj: { email: string };

    try {
      const target = await getUser(userId);
      targetObj = { email: target.email };
    } catch (err) {
      targetObj = { email: "" };
    }

    let requestedBy: { id: string; email: string } = { email: "", id: "" };

    if (requestedById) {
      try {
        const user = await getUser(requestedById);
        requestedBy = { id: requestedById, email: user.email };
      } catch (err) {
        requestedBy = { id: requestedById, email: "" };
      }
    }

    await emitUserRoleChangedEvent(
      "published/production",
      new Date(),
      requestedBy,
      tenantId,
      targetObj
    );
  } catch (err) {
    if (err && err.code === "ConditionalCheckFailedException") {
      throw new UserNotFoundError();
    }
    throw err;
  }
};

export const updateUserDetails = async (
  firstName: string,
  lastName: string,
  marketingRole: string,
  tenantId: string,
  userId: string
) => {
  if (!firstName && !lastName && !marketingRole) {
    return;
  }

  const ExpressionAttributeNames = Object.assign(
    {
      "#tenantId": "tenantId",
      "#userId": "userId",
    },
    firstName ? { "#firstName": "firstName" } : null,
    lastName ? { "#lastName": "lastName" } : null,
    marketingRole ? { "#marketingRole": "marketingRole" } : null
  );

  const ExpressionAttributeValues = Object.assign(
    {},
    firstName ? { ":firstName": "firstName" } : null,
    lastName ? { ":lastName": "lastName" } : null,
    marketingRole ? { ":marketingRole": "marketingRole" } : null
  );

  const updateExpressions = [
    firstName ? "#firstName = :firstName" : null,
    lastName ? "#lastName = :lastName" : null,
    marketingRole ? "#marketingRole = :marketingRole" : null,
  ];

  await dynamo.update({
    ConditionExpression:
      "attribute_exists(#tenantId) AND attribute_exists(#userId)",
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    Key: {
      tenantId,
      userId,
    },
    ReturnValues: "ALL_NEW",
    TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
    UpdateExpression: `SET ${updateExpressions.filter((i) => i).join(", ")}`,
  });
};

export const filterByMarketingRole = async (
  tenantId: string,
  marketingRole: string
) => {
  const response = await dynamo.query({
    ExpressionAttributeNames: {
      "#marketingRole": "marketingRole",
    },
    ExpressionAttributeValues: {
      ":marketingRole": marketingRole,
      ":tenantId": tenantId,
    },
    FilterExpression: "#marketingRole = :marketingRole",
    IndexName: "by-tenant-index",
    KeyConditionExpression: "tenantId = :tenantId",
    TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
  });

  return response.Items;
};

interface IListAccessRightsOptions {
  role?: Role;
}

export const listAccessRights = async (
  tenantId: string,
  opts?: IListAccessRightsOptions
) => {
  const users = await service.list({
    ExpressionAttributeNames: {
      "#tenantId": "tenantId",
    },
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    KeyConditionExpression: "#tenantId = :tenantId",
    IndexName: "by-tenant-index",
  });

  return opts?.role
    ? users.items.filter((user) => user.role === opts.role)
    : users.items;
};
