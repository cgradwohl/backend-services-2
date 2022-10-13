import * as systemRoles from "~/lib/access-control/roles";
import { getItem, query, deleteItem, update } from "~/lib/dynamo";
import { IUserRoleService } from "./types";
import { IRole } from "../access-control/types";

const findSystemRole = (key: string): IRole => {
  for (const role in systemRoles) {
    if (systemRoles[role].key === key) {
      return systemRoles[role];
    }
  }
};

const fromDynamoItem = (item: any): IRole => {
  if (!item) {
    return;
  }

  return {
    description: item.description,
    label: item.label,
    key: item.sk.replace(/^role\//, ""),
    policies: item.policies,
  };
};

export default (tenantId: string): IUserRoleService => {
  return {
    delete: async (key) => {
      await deleteItem({
        Key: {
          pk: tenantId,
          sk: `role/${key}`,
        },
        TableName: process.env.USER_ROLES_TABLE_NAME,
      });
    },

    get: async (key) => {
      const response = await getItem({
        Key: {
          pk: tenantId,
          sk: `role/${key}`,
        },
        TableName: process.env.USER_ROLES_TABLE_NAME,
      });

      if (response?.Item) {
        return fromDynamoItem(response?.Item);
      }

      return findSystemRole(key);
    },

    list: async () => {
      const { Items: items } = await query({
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": tenantId,
          ":sk": `role/`,
        },
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
        TableName: process.env.USER_ROLES_TABLE_NAME,
      });

      const roles: { [key: string]: IRole } = { ...systemRoles };
      // overlay custom roles in case changes are required for a system role
      for (const item of items) {
        const key = item.sk.replace(/^role\//, "");
        roles[key] = fromDynamoItem(item);
      }

      return Object.keys(roles).map((key) => ({
        ...roles[key],
      }));
    },

    replace: async (role) => {
      await update({
        ExpressionAttributeNames: {
          "#description": "description",
          "#label": "label",
          "#policies": "policies",
        },
        ExpressionAttributeValues: {
          ":description": role.description,
          ":label": role.label,
          ":policies": role.policies,
        },
        Key: {
          pk: tenantId,
          sk: `role/${role.key}`,
        },
        UpdateExpression:
          "SET #description = :description, #label = :label, #policies = :policies",
        TableName: process.env.USER_ROLES_TABLE_NAME,
      });
    },
  };
};
