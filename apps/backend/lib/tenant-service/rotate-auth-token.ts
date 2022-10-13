import makeError from "make-error";
import uuidv4 from "uuid/v4";

import { emitApiKeyRotatedEvent } from "~/auditing/services/emit";
import { toApiKey } from "~/lib/api-key-uuid";
import { query, transactWrite } from "../dynamo";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import { defaultScopes } from "./token-scopes";

export const TokenNotFound = makeError("TokenNotFound");

const TableName = getTableName(TABLE_NAMES.TENANT_AUTH_TOKENS_TABLE_NAME);

const rotateAuthToken = async (
  user: { email: string; id: string },
  tenantId: string,
  oldAuthToken: string
) => {
  const authTokens = await query({
    ExpressionAttributeValues: {
      ":tenantId": tenantId,
    },
    IndexName: "by-tenant-index",
    KeyConditionExpression: "tenantId = :tenantId",
    TableName,
  });

  const existingToken = authTokens?.Items?.find(
    (item) => item.authToken === oldAuthToken
  );

  if (!existingToken) {
    throw new TokenNotFound(`Auth Token$ ${oldAuthToken} not found.`);
  }

  const [scope, prefix] =
    [...defaultScopes.entries()].find(([, p]) => oldAuthToken.startsWith(p)) ??
    defaultScopes[0];
  const authToken = `${prefix}${toApiKey(uuidv4())}`;
  const timestamp = new Date();

  const TransactItems = [
    {
      Delete: {
        Key: {
          authToken: oldAuthToken,
        },
        TableName,
      },
    },
    {
      Put: {
        Item: {
          apiKey: existingToken.apiKey,
          authToken,
          created: timestamp.getTime(),
          creator: user.id,
          scope,
          tenantId,
        },
        TableName,
      },
    },
  ];

  await transactWrite({
    TransactItems,
  });

  await emitApiKeyRotatedEvent(scope, timestamp, user, tenantId);

  return authToken;
};

export default rotateAuthToken;
