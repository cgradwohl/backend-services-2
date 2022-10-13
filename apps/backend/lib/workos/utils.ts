import {
  getSsoUserByEmail as cognitoGetUserByEmail,
  IUser,
  UserNotFound,
} from "~/lib/cognito";
import { UserData } from "./webhook-types";
import { NotFound } from "~/lib/http-errors";
import { get as getTenantAccess } from "~/lib/tenant-access-rights-service";
import { deleteUser as removeFromUserPool } from "~/lib/users";
import getEnvVar from "~/lib/get-environment-variable";

export function getWorkOsWebhookSecret(): string {
  return getEnvVar("WORKOS_WEBHOOK_SECRET");
}

export function getEmailFromWorkOSUserData(user: UserData): string {
  const email = user.emails.find((email) => email.primary)?.value;
  if (!email) {
    throw new Error(`No primary address for ${user.username}`);
  }
  return email;
}

/** Returns undefined on UserNotFound instead of throwing. Will throw for other errors. */
export async function getCognitoUserByEmail(
  email: string
): Promise<IUser | undefined> {
  try {
    return await cognitoGetUserByEmail(email);
  } catch (error) {
    if (error instanceof UserNotFound) {
      return;
    }
    throw error;
  }
}

/** Wrapper for deleteUser that doesn't throw NotFound */
export async function softRemoveFromUserPool(userId: string, tenantId: string) {
  try {
    await removeFromUserPool(userId, tenantId, undefined);
  } catch (error) {
    if (error instanceof NotFound) return;
    throw error;
  }
}

export async function getIsUserActive(
  email: string,
  tenantId
): Promise<boolean> {
  const user = await getCognitoUserByEmail(email);
  if (!user) return false;
  const access = await getTenantAccess({ tenantId, userId: user.id });
  return !!access;
}
