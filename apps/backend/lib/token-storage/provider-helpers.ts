import { DeliveryHandlerParams } from "~/providers/types";
import { evaluateTokenFreshness } from "./token-storage";
import { TokensByProvider } from "./types";

/**
 * Finds the correct tokens to use based on precedence rules.
 *
 * If token attached to profile, use that. If not look up tokens associated with passed user_id
 * and return those.
 *
 * Will set isManaged true if tokens should be validated / invalidated using Courier Token Storage API.
 */
export async function getTokensForProvider(opts: {
  params: DeliveryHandlerParams;
  providerKey: string;
  profileTokenExtractor: (profile: any) => string[] | undefined;
  maxTokenAgeMs?: number;
}): Promise<{
  tokens: string[];
  isManaged: boolean;
}> {
  const { params, providerKey, profileTokenExtractor, maxTokenAgeMs } = opts;
  const profileTokens = profileTokenExtractor(params.profile);

  if (profileTokens) {
    return {
      tokens: profileTokens,
      isManaged: false,
    };
  }

  const managedTokens = params.variableData?.tokens?.[providerKey];
  if (managedTokens) {
    return {
      tokens: await evaluateTokenFreshness(managedTokens, maxTokenAgeMs),
      isManaged: true,
    };
  }

  return {
    tokens: [],
    isManaged: false,
  };
}

export type StandardProfileTokenFormat = {
  tokens?: string[] | string;
  token?: string;
};

/** Extracts tokens from the profile for providers that implement the standard profile token format such as apn and expo */
export function standardProfileTokenExtractor(
  providerKey: string,
  profile: {
    [providerKey: string]: StandardProfileTokenFormat | undefined;
  }
): string[] | undefined {
  const profileTokenData = profile[providerKey];
  if (!profileTokenData) {
    return;
  }

  const tokens: string[] = [];

  if (Array.isArray(profileTokenData.tokens)) {
    tokens.push(...profileTokenData.tokens);
  }

  if (profileTokenData.tokens && typeof profileTokenData.tokens === "string") {
    tokens.push(profileTokenData.tokens);
  }

  if (profileTokenData.token) {
    tokens.push(profileTokenData.token);
  }

  // Do no allow duplicate tokens
  return [...new Set(tokens)];
}

export function providerHasStoredTokens(
  provider: string,
  tokensByProvider?: TokensByProvider
): boolean {
  return !!tokensByProvider?.[provider]?.length;
}
