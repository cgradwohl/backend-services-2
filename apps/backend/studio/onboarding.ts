import KoaRouter from "koa-router";
import { rateLimitMiddleware } from "~/lib/middleware";
import * as tenantAccessRightsService from "~/lib/tenant-access-rights-service";
import * as tenants from "~/lib/tenant-service";

const onboarding = new KoaRouter();

onboarding.get("/info", rateLimitMiddleware("onboarding/info"), async (ctx) => {
  const { tenantId, userId } = ctx.userContext;

  const { role } = await tenantAccessRightsService.get({
    tenantId,
    userId,
  });

  const usersWithEngineeringRole = await tenantAccessRightsService.filterByMarketingRole(
    tenantId,
    "engineering"
  );

  const { usageActual } = await tenants.get(tenantId);

  ctx.body = {
    tenantHasEngineer: usersWithEngineeringRole
      ? usersWithEngineeringRole.length > 0
      : false,
    tenantNotificationSendCount: usageActual ?? 0,
    userRole: role,
  };
});

export default onboarding;
