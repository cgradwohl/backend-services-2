import dynamoObjectService from "../dynamo/object-service";
import * as verificationCode from "./invite-user-code";

import { CourierObject, InvitationJson } from "~/types.api";
import { IArchiveInvitationFn, InvitationObject } from "~/types.internal";

const invitation = dynamoObjectService<InvitationJson>("invitation");

export const create = invitation.create;
export const list = invitation.list;
export const get = invitation.get;

// custom remove function to remove both invitation object record
// as well as invitation cord record after a new user is created and
// associated with a tenant
export const remove: IArchiveInvitationFn<InvitationObject> = async ({
  userId,
  tenantId,
  code,
  email,
}) => {
  // check for item existance in tenant invitation list
  // since querying by title not available
  const tenantInvitations = await invitation.list({ tenantId });

  // remove all invitation objects for this code as it is currently
  // possible to have multiple entries
  tenantInvitations.objects
    .filter(
      (inv: CourierObject) => inv.title === code || inv.json.email === email
    )
    .map(async (inv: CourierObject) => {
      const id = inv.id;
      await invitation.archive({ id, tenantId, userId });
    });

  // remove code regardless of invites found
  await verificationCode.remove(code);

  return;
};

export const getInvitationByEmail = async (
  email: string,
  tenantId: string
): Promise<CourierObject<InvitationJson> | undefined> => {
  const tenantInvitations = await invitation.list({ tenantId });
  return tenantInvitations.objects.find((inv) => inv.json.email === email);
};
