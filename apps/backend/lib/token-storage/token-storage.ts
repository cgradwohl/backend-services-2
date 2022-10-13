import { addDays } from "date-fns";
import { getItem, put, update, query, deleteItem, batchWrite } from "../dynamo";
import { buildDynamoUpdate } from "../dynamo/build-update";
import getEnvVar from "../get-environment-variable";
import { getTtlFromNow } from "../get-ttl";
import { removeUndefinedFields } from "../remove-undefined-fields";
import {
  getPk,
  getGsi1Pk,
  dynamoItemToRecipientToken,
  dynamoItemFromWritableRecipientToken,
} from "./dynamo-utils";
import {
  WriteableRecipientToken,
  RecipientToken,
  UpdatableRecipientToken,
} from "./types";

export async function putToken(
  recipientToken: WriteableRecipientToken
): Promise<void> {
  await put({
    Item: dynamoItemFromWritableRecipientToken(recipientToken),
    TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
  });
}

export async function putTokens({
  tenantId,
  recipientId,
  tokens,
}: {
  tenantId: string;
  recipientId: string;
  tokens: WriteableRecipientToken[];
}): Promise<void> {
  const putItems = tokens.map(dynamoItemFromWritableRecipientToken);
  const putTokens = new Set(tokens.map((token) => token.token));
  const prevTokens = await getTokensByRecipient({
    tenantId,
    recipientId,
  }).then((tokens) => tokens.map((token) => token.token));
  const tokensToDelete = prevTokens.filter((token) => !putTokens.has(token));

  const requests = [
    ...putItems.map((Item) => ({
      PutRequest: {
        Item,
      },
    })),
    ...tokensToDelete.map((token) => ({
      DeleteRequest: {
        Key: {
          pk: getPk({ tenantId, token }),
        },
      },
    })),
  ];

  while (requests.length) {
    await batchWrite({
      RequestItems: {
        [getEnvVar("TOKEN_STORAGE_TABLE")]: requests.splice(0, 25),
      },
    });
  }
}

export async function getToken(opts: {
  tenantId: string;
  token: string;
}): Promise<RecipientToken | undefined> {
  const { tenantId, token } = opts;

  const { Item } = await getItem({
    Key: {
      pk: getPk({ tenantId, token }),
    },
    TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
  });

  return dynamoItemToRecipientToken(Item);
}

export async function deleteToken(opts: {
  tenantId: string;
  token: string;
}): Promise<void> {
  const { tenantId, token } = opts;

  await deleteItem({
    Key: {
      pk: getPk({ tenantId, token }),
    },
    TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
  });
}

export async function getTokensByRecipient(opts: {
  tenantId: string;
  recipientId: string;
}): Promise<RecipientToken[]> {
  const { tenantId, recipientId } = opts;

  const { Items } = await query({
    IndexName: "gsi1",
    KeyConditionExpression: "#gsi1pk = :gsi1pk",
    ExpressionAttributeNames: {
      "#gsi1pk": "gsi1pk",
    },
    ExpressionAttributeValues: {
      ":gsi1pk": getGsi1Pk({ tenantId, recipientId }),
    },
    TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
  });

  return (Items ?? []).map(dynamoItemToRecipientToken);
}

/** @returns Record<providerKey, RecipientToken[]> */
export async function getTokensByProvider(opts: {
  tenantId: string;
  recipientId: string;
}): Promise<Record<string, RecipientToken[]>> {
  return (
    await getTokensByRecipient({
      recipientId: opts.recipientId,
      tenantId: opts.tenantId,
    })
  )
    .filter((token) => token.status === "active" || token.status === "unknown")
    .reduce((acc, cur) => {
      acc[cur.providerKey] = [...(acc[cur.providerKey] ?? []), cur];
      return acc;
    }, {} as Record<string, RecipientToken[]>);
}

export async function updateToken(
  updatedToken: UpdatableRecipientToken
): Promise<void> {
  const { tenantId, token, ...updatedFields } = updatedToken;

  removeUndefinedFields(updatedFields);
  delete updatedFields.created;

  await update({
    ConditionExpression: "attribute_exists(pk)",
    Key: { pk: getPk({ tenantId, token }) },
    TableName: getEnvVar("TOKEN_STORAGE_TABLE"),
    ...buildDynamoUpdate({
      ...updatedFields,
      ...(updatedFields.status === "failed"
        ? { ttl: getTtlFromNow({ days: 14 }) }
        : {}),
      updated: new Date().toISOString(),
    }),
  });
}

/** Invalidates old tokens, returns tokens that are still valid */
export async function evaluateTokenFreshness(
  tokens: RecipientToken[],
  maxTokenAgeMs?: number
): Promise<string[]> {
  const tokensSet = new Set(tokens.map((token) => token.token));

  // Filter out stale tokens
  await Promise.all(
    tokens.map(async (token) => {
      const created = new Date(token.created);
      const expired =
        token.expiryDate === false
          ? false
          : typeof token.expiryDate === "string"
          ? new Date() > new Date(token.expiryDate)
          : typeof maxTokenAgeMs === "number" &&
            Date.now() - created.getTime() > maxTokenAgeMs;

      if (expired) {
        await markTokenAsStale(token, maxTokenAgeMs);
        tokensSet.delete(token.token);
      }
    })
  );

  return [...tokensSet];
}

export async function markTokenAsStale(
  token: RecipientToken,
  maxAgeMs?: number
): Promise<void> {
  const reason =
    typeof maxAgeMs === "number"
      ? `(expired after max age of ${maxAgeMs}ms).`
      : "(token older than supplied expiration date).";

  updateToken({
    token: token.token,
    tenantId: token.tenantId,
    status: "failed",
    statusReason: `Token marked stale ${reason}`,
  });
}

export type TokenUsageResult = {
  token: string;
  status: "active" | "failed";
  reason?: string;
};

export async function updateTokenStatuses({
  tenantId,
  results,
}: {
  tenantId: string;
  results: TokenUsageResult[];
}): Promise<void> {
  await Promise.all(
    results.map(async (result) =>
      updateToken({
        token: result.token,
        tenantId,
        status: result.status,
        statusReason:
          result.reason ??
          (result.status === "failed"
            ? "Token failed on use"
            : "Token successfully used"),
        lastUsed: new Date().toISOString(),
      })
    )
  );
}
