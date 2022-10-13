import { UserData } from "../webhook-types";
import {
  getEmailFromWorkOSUserData,
  getCognitoUserByEmail,
  softRemoveFromUserPool,
} from "../utils";
import {
  getInvitationByEmail,
  remove as removeInvitation,
} from "~/lib/invitation-service/invite-user-object";

export async function removeUser(userData: UserData, tenantId: string) {
  const email = getEmailFromWorkOSUserData(userData);
  const [existingUser, invite] = await Promise.all([
    getCognitoUserByEmail(email),
    getInvitationByEmail(email, tenantId),
  ]);

  await Promise.all([
    existingUser
      ? softRemoveFromUserPool(existingUser.id, tenantId)
      : Promise.resolve(),
    invite
      ? await removeInvitation({
          tenantId,
          code: invite.json.code,
          email,
          userId: "",
        })
      : Promise.resolve(),
  ]);
}
