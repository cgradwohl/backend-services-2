import { getTokensByProvider, RecipientToken } from "~/lib/token-storage";

/**
 * Returns all tokens associated with the user as Record<providerKey, RecipientToken>
 * TODO: Only fetch if the possible routes include routes that need tokens.
 */
export async function getTokens({
  userId,
  tenantId,
}: {
  userId: string;
  tenantId: string;
}): Promise<Record<string, RecipientToken[]> | undefined> {
  if (!userId) {
    return undefined;
  }

  return getTokensByProvider({
    tenantId,
    recipientId: userId,
  });
}
