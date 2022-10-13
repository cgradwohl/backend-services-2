import { UserData } from "../webhook-types";
import { validateOrigin } from "~/lib//get-cors-origin";
import inviteUser from "~/lib/invitation-service/invite-user";
import {
  getCognitoUserByEmail,
  getEmailFromWorkOSUserData,
  getIsUserActive,
} from "../utils";
import { get as getTenant } from "~/lib/tenant-service";
import {
  getInvitationByEmail,
  remove as removeInvitation,
} from "~/lib/invitation-service/invite-user-object";
import makeError from "make-error";
import {
  DirectorySyncUser,
  getDirectorySyncTenantMap,
  getDirectorySyncUser,
  putDirectorySyncUser,
} from "./directory-sync-table";
import { removeUser } from "./remove-user";
import { setRole } from "~/lib/tenant-access-rights-service";
import { ITenant } from "~/types.api";
import { NotFound } from "~/lib/http-errors";

export const TenantNotFoundError = makeError("TenantNotFoundError");

export async function syncUser(userData: UserData, eventTimestamp: number) {
  const tenantMap = await getDirectorySyncTenantMap(userData.directory_id);
  if (!tenantMap) {
    throw new NotFound("No tenant found for supplied directory");
  }

  const email = getEmailFromWorkOSUserData(userData);

  const [tenant, userActive, dsyncUser] = await Promise.all([
    getTenant(tenantMap.tenantId),
    getIsUserActive(email, tenantMap.tenantId), // User accepted invite
    getDirectorySyncUser(userData.directory_id, userData.idp_id),
  ]);
  const userHasBeenSuspended = ["inactive", "suspended"].includes(
    userData.state
  );

  if (dsyncUser && dsyncUser.updated > eventTimestamp) return; // Out of order event.
  if (!tenant) throw new TenantNotFoundError();

  await Promise.all([
    userHasBeenSuspended
      ? removeUser(userData, tenantMap.tenantId)
      : userActive
      ? syncActiveUser(userData, tenantMap.tenantId)
      : syncUserInvite({ email, tenant, userData, dsyncUser }),
    putDirectorySyncUser({
      directoryId: userData.directory_id,
      idpUserId: userData.idp_id,
      state: userData.state,
      role: getRoleFromUserData(userData),
      tenantId: tenantMap.tenantId,
      updated: eventTimestamp,
    }),
  ]);
}

async function syncActiveUser(userData: UserData, tenantId: string) {
  await updateActiveUserRole(userData, tenantId);
}

async function updateActiveUserRole(userData: UserData, tenantId: string) {
  const user = await getCognitoUserByEmail(
    getEmailFromWorkOSUserData(userData)
  );

  if (!user) return; // User hasn't accepted invite yet. Role can not be changed.

  await setRole(tenantId, user.id, getRoleFromUserData(userData), undefined);
}

async function syncUserInvite({
  email,
  tenant,
  userData,
  dsyncUser,
}: {
  email: string;
  tenant: ITenant;
  userData: UserData;
  dsyncUser?: DirectorySyncUser;
}) {
  const attributesChanged =
    dsyncUser === undefined ||
    userData.custom_attributes?.role !== dsyncUser?.role;

  const existingInvite = await getInvitationByEmail(email, tenant.tenantId);
  if (existingInvite && attributesChanged) {
    await removeInvitation({
      tenantId: tenant.tenantId,
      code: existingInvite.json.code,
      email,
      userId: "",
    });
  }

  if (existingInvite && !attributesChanged) {
    return;
  }

  await inviteUser({
    email,
    tenant,
    userId: tenant.owner ?? "",
    origin: validateOrigin({ origin: "https://app.courier.com" }),
    role: getRoleFromUserData(userData),
  });
}

function getRoleFromUserData(userData: UserData) {
  return userData.custom_attributes?.role ?? "ANALYST";
}
