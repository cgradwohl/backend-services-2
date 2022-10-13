import providers from "~/providers";

export type TokensByProvider = { [providerKey: string]: RecipientToken[] };

export interface RecipientToken {
  token: string;

  tenantId: string;

  recipientId: string;

  providerKey: keyof typeof providers;

  status: TokenStatus;

  statusReason: string;

  /** Date the token was last used. ISO 8601 Date */
  lastUsed?: string;

  /** ISO 8601 Date. Set to false to disable expiration */
  expiryDate?: string | false;

  /** Additional properties to be passed to provider or to be generically associated with the token */
  properties?: { [key: string]: any };

  device?: {
    appId?: string;
    adId?: string;
    deviceId?: string;
    platform?: string;
    manufacturer?: string;
    model?: string;
  };

  tracking?: {
    osVersion?: string;
    ip?: string;
    lat?: string;
    long?: string;
  };

  /** ISO 8601 Date */
  created: string;

  /** ISO 8601 Date */
  updated: string;
}

export type WriteableRecipientToken = Omit<
  RecipientToken,
  "created" | "updated"
> & {
  created?: string;
};

export type UpdatableRecipientToken = Partial<RecipientToken> & {
  tenantId: string;
  token: string;
};

export type RecipientTokenDynamoItem = RecipientToken & {
  /** tenantId/token */
  pk: `${string}/${string}`;

  /** tenantId/recipientId */
  gsi1pk: `${string}/${string}`;

  /** tenantId/shard */
  gsi2pk: `${string}/${number}`;

  tenantId: string;
};

/**
 * Unknown - Token has been created but not yet used
 * Active - Token has been successfully used
 * Failed - Token is no longer authorized and can be safely removed
 * Revoked - Token has been revoked. In some cases a stateless token may be checked against this value, so revoked tokens should be retained.
 */
export type TokenStatus = "unknown" | "active" | "failed" | "revoked";
