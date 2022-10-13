import { AuthenticationError } from "apollo-server-lambda";
import { APIGatewayEvent } from "aws-lambda";
import { IContext } from "../types";

export default ({
  event,
}: {
  event: APIGatewayEvent;
}): Pick<
  IContext,
  "env" | "user" | "scope" | "tenantId" | "userIds" | "authType" | "authScope"
> => {
  const {
    requestContext: { authorizer },
  } = event;
  const { tenantId, userId, userIds, scope, env, authType, authScope } =
    authorizer;

  if (!tenantId || (!userId && !userIds)) {
    throw new AuthenticationError("Unauthorized");
  }

  return {
    env,
    userIds: userIds?.split(","),
    scope,
    tenantId,
    user: userId
      ? {
          id: userId,
        }
      : undefined,
    authType,
    authScope,
  };
};
