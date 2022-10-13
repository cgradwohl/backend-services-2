import { assertIsNever } from "~/lib/assertions/is-never";
import { IUserProvider, IUserSsoProvider } from "~/types.api";
import { getSsoProviderCognitoIdFromEmail } from "./get-sso-provider-from-email";

const ssoRegex = /^\w+_/;

export const isSsoUser = (username: string): boolean =>
  username && ssoRegex.test(username);

export const getSignInProvider = (userId: string): IUserProvider => {
  if (!isSsoUser(userId)) {
    return "email";
  }

  // provider is the sequence of characters up to but not including the final _
  const provider = userId.match(ssoRegex)[0].slice(0, -1);

  switch (provider.toLowerCase()) {
    case "google":
      return "google";
    case "github":
      return "github";
    default:
      // Note: We are intentionally keeping the casing for custom providers
      return `custom:${provider}`;
  }
};

export const getSignInProviderFromDomainOfEmail = async (
  email: string
): Promise<IUserProvider> => {
  const cognitoProviderId = await getSsoProviderCognitoIdFromEmail(email);

  if (!cognitoProviderId) {
    throw new Error(`No SSO provider found for email ${email}`);
  }

  return `custom:${cognitoProviderId}`;
};

export function isValidSsoProvider(
  ssoProvider?: IUserSsoProvider
): ssoProvider is IUserSsoProvider {
  if (!ssoProvider) {
    return false;
  }

  if (isCustomSsoProvider(ssoProvider)) {
    return true;
  }

  switch (ssoProvider) {
    case "google":
    case "github":
      return true;
    default:
      assertIsNever(ssoProvider, "Invalid SSO provider");
  }
}

function isCustomSsoProvider(
  ssoProvider: string
): ssoProvider is `custom:${string}` {
  return ssoProvider.startsWith("custom:");
}

export const isGoogleSsoUser = (userId: string): boolean =>
  getSignInProvider(userId) === "google";

export const isCustomSsoUser = (userId: string): boolean =>
  getSignInProvider(userId).startsWith("custom:");

export * from "./get-sso-provider-from-email";
