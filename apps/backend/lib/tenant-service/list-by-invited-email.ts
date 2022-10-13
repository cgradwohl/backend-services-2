import { queryByEmail as getInvitations } from "~/lib/invitation-service/invite-user-code";
import { get, getUserCount } from "~/lib/tenant-service";
import { ITenant, TenantsGetResponseTenant } from "~/types.api";

export default async (email: string) => {
  const invited: TenantsGetResponseTenant[] = [];
  const invitations = await getInvitations(email);

  for (const invitation of invitations) {
    const tenantId = invitation.data.tenantId;
    const tenant: ITenant = await get(tenantId);
    if (tenant.archived) {
      // ignore archived tenants
      // this can happen if an invite was sent but
      // before it got accepted the tenant was archived
      continue;
    }
    const userCount: number = await getUserCount(tenantId);
    invited.push({
      invitationCode: invitation.code,
      name: tenant.name,
      requireSso: tenant.requireSso,
      tenantId: tenant.tenantId,
      userCount,
    });
  }

  return invited;
};
