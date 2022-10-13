import { ForbiddenError } from "apollo-server-lambda";
import { APIGatewayEvent } from "aws-lambda";

import { getSignInProvider } from "~/lib/cognito/sso";
import * as accessRights from "~/lib/tenant-access-rights-service";
import roles from "~/lib/user-roles";
import assertAuthenticated from "./assert-authenticated";
import getClaim from "./get-claim";
import getEnv from "./get-env";
import getTenantId from "./get-tenant-id";
import getUserId from "./get-user-id";

export default async ({ event }: { event: APIGatewayEvent }) => {
  const env = getEnv(event);
  const scope = `published/${env}`;
  const tenantId = getTenantId(event);
  const userId = getUserId(event);

  await assertAuthenticated(event);

  const accessRight = await accessRights.get({ tenantId, userId });
  if (!accessRight) {
    throw new ForbiddenError("Forbidden");
  }

  const email = getClaim(event, "email");
  const emailVerified = getClaim(event, "email_verified") === true;
  const provider = getSignInProvider(userId);
  const role = await roles(tenantId).get(accessRight.role ?? "MANAGER");

  return {
    env,
    scope,
    tenantId,
    user: {
      email,
      emailVerified,
      id: userId,
      provider,
      role,
    },
  };
};
