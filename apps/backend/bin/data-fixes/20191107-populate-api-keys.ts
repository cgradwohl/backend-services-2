import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { scan, update } from "../../lib/dynamo";

/*
Invoke like so:

yarn serverless:invoke-local -f BinPopulateApiKeys
*/

interface IAuthTokenItem {
  tenantId: string;
  authToken: string;
  apiKey?: string;
}

const migrate = async (item: IAuthTokenItem) => {
  if (item.apiKey && item.apiKey.length) {
    console.log(`authToken ${item.authToken} already has API key specified`);
    return;
  }

  console.log(
    `Updating auth token ${item.authToken} for tenant ${item.tenantId}.`
  );
  const apiKey = item.authToken;

  await update({
    TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
    Key: {
      authToken: item.authToken,
    },
    UpdateExpression: "set apiKey = :apiKey",
    ExpressionAttributeValues: {
      ":apiKey": apiKey,
    },
    ReturnValues: "NONE",
  });

  await update({
    TableName: getTableName(TABLE_NAMES.TENANTS_TABLE_NAME),
    Key: {
      tenantId: item.tenantId,
    },
    UpdateExpression: "set apiKey = :apiKey",
    ExpressionAttributeValues: {
      ":apiKey": apiKey,
    },
    ReturnValues: "NONE",
  });
};

export const handle = async () => {
  let next = undefined;

  while (true) {
    const res = await scan({
      TableName: getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME),
      ExclusiveStartKey: next,
    });

    console.log(`Processing ${res.Items.length} items.`);

    for (const item of res.Items as Array<IAuthTokenItem>) {
      await migrate(item);
    }

    if (res.LastEvaluatedKey && res.Items.length) {
      next = res.LastEvaluatedKey;
    } else {
      break;
    }
  }

  console.log("populate-api-keys complete");
};
