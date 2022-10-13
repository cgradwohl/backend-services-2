import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getHashFromRange } from "../get-hash-from-range";
import { removeUndefinedFields } from "../remove-undefined-fields";
import {
  WriteableRecipientToken,
  RecipientToken,
  RecipientTokenDynamoItem,
} from "./types";

/** @returns tenantId/token */
export function getPk(opts: {
  tenantId: string;
  token: string;
}): `${string}/${string}` {
  const { tenantId, token } = opts;
  return `${tenantId}/${token}`;
}

/** @returns tenantId/recipientId */
export function getGsi1Pk(opts: {
  tenantId: string;
  recipientId: string;
}): `${string}/${string}` {
  const { tenantId, recipientId } = opts;
  return `${tenantId}/${recipientId}`;
}

/** @returns tenantId/shard */
export function getGsi2Pk(opts: { tenantId: string }): `${string}/${number}` {
  const { tenantId } = opts;
  return `${tenantId}/${getHashFromRange(10)}`;
}

export function dynamoItemFromWritableRecipientToken(
  recipientToken: WriteableRecipientToken
): RecipientTokenDynamoItem {
  const { recipientId, token, tenantId } = recipientToken;

  return {
    ...removeUndefinedFields(recipientToken),
    pk: getPk({ tenantId, token }),
    gsi1pk: getGsi1Pk({ tenantId, recipientId }),
    gsi2pk: getGsi2Pk({ tenantId }),
    created: recipientToken.created ?? new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

export function dynamoItemToRecipientToken(
  dynamoItem?: DocumentClient.AttributeMap
): RecipientToken | undefined {
  if (!dynamoItem) {
    return undefined;
  }

  const { gsi1pk, gsi2pk, pk, ...item } =
    dynamoItem as RecipientTokenDynamoItem;

  return item;
}
