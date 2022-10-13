import uuidv4 from "uuid/v4";

import { toApiKey } from "~/lib/api-key-uuid";
import { query, transactWrite } from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import log from "~/lib/log";
import {
  defaultScopes,
  publishedProductionScope,
} from "~/lib/tenant-service/token-scopes";

interface IAuthTokenItem {
  authToken: string;
  apiKey: string;
  created: number;
  creator: string;
  tenantId: string;
}

const TableName = getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME);

export const handle = async (event: any) => {
  const tenantId = event.tenantId;

  if (!tenantId) {
    throw new Error("tenantId is a required property on the event");
  }

  log(`Adding auth tokens for tenant ${tenantId}.`);

  const { Items } = await query({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    IndexName: "by-tenant-index",
    KeyConditionExpression: "tenantId = :tenantId",
    TableName,
  });

  // A new tenant will have four auth tokens; nothing to do.
  if (Items.length > 1) {
    return;
  }

  const [publishedProd] = Items as IAuthTokenItem[];

  // Exclude the published production scope and prefix.
  const [, ...scopes] = [...defaultScopes.entries()];
  const created = new Date().getTime();

  const addScopeToPublishedProd = {
    Put: {
      Item: {
        ...publishedProd,
        scope: publishedProductionScope,
      },
      TableName,
    },
  };
  const TransactItems = [addScopeToPublishedProd].concat(
    scopes.map(([scope, prefix]) => ({
      Put: {
        Item: {
          apiKey: publishedProd.apiKey,
          authToken: `${prefix}${toApiKey(uuidv4())}`,
          created,
          creator: tenantId,
          scope,
          tenantId,
        },
        TableName,
      },
    }))
  );
  await transactWrite({
    TransactItems,
  });
};
