import { IUserSsoProvider } from "~/types.api";
import { IUser } from "../cognito";
import { isCustomSsoUser, isGoogleSsoUser } from "../cognito/sso";
import { Unauthorized } from "../http-errors";

/** Ensures the new owner of a tenant uses required ss */
export function validateNewOwnerIdP({
  requireSso,
  domains,
  newOwner,
}: {
  requireSso?: IUserSsoProvider;
  domains: any[];
  newOwner: IUser;
}) {
  if (!requireSso || domains.length <= 0) return;

  if (
    (requireSso === "google" && !isGoogleSsoUser(newOwner.id)) ||
    !domains.find((domain) => newOwner.email.endsWith(domain))
  ) {
    throw new Unauthorized(
      `New owner must be a Google Single Sign-On (SSO) user with one of the domains: ${domains.join()}`
    );
  }

  if (
    (requireSso.startsWith("custom:") && !isCustomSsoUser(newOwner.id)) ||
    !domains.find((domain) => newOwner.email.endsWith(domain))
  ) {
    throw new Unauthorized(
      `New owner must be a Single Sign-On (SSO) user with one of the domains: ${domains.join()}`
    );
  }
}
