import * as tenantAccess from "~/lib/tenant-access-rights-service";

const grant = async (tenantId: string, userId: string) => {
  await tenantAccess.create({
    created: Date.now(),
    creator: userId,
    role: "ADMINISTRATOR",
    tenantId,
    userId,
    isCourierEmployee: true,
  });
  // tslint:disable-next-line: no-console
  console.log(`${tenantId}: ${userId} granted access`);
};

const revoke = async (tenantId: string, userId: string) => {
  await tenantAccess.remove({
    tenantId,
    userId,
  });
  // tslint:disable-next-line: no-console
  console.log(`${tenantId}: ${userId} revoked access`);
};

export default { grant, revoke };
