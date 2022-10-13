import { emitUserDeletedEvent } from "~/auditing/services/emit";
import { unsubscribe } from "~/lib/lists";
import * as tenantAccessRightsService from "~/lib/tenant-access-rights-service";
import { getUser } from "../cognito";

export async function deleteUser(
  userIdToDelete: string,
  tenantId: string,
  requestedByUserId?: string
) {
  await tenantAccessRightsService.remove({ tenantId, userId: userIdToDelete });

  // This assumes we have run the migration introduced in https://github.com/trycourier/backend/pull/1414
  await unsubscribe(
    process.env.COURIER_TENANT_ID,
    `tenant.${tenantId}`,
    userIdToDelete
  );

  // emit audit event
  let deletedUser: { id: string; email: string };
  try {
    const { email } = await getUser(userIdToDelete);
    deletedUser = { id: userIdToDelete, email };
  } catch (err) {
    deletedUser = { id: userIdToDelete, email: "" };
  }

  let requestedBy: { id: string; email: string } = {
    email: "",
    id: "",
  };

  if (requestedByUserId) {
    try {
      const { email } = await getUser(userIdToDelete);
      requestedBy = { id: requestedByUserId, email };
    } catch (err) {
      requestedBy = { id: requestedByUserId, email: "" };
    }
  }

  await emitUserDeletedEvent(
    "published/production",
    new Date(),
    requestedBy,
    tenantId,
    deletedUser
  );
}
