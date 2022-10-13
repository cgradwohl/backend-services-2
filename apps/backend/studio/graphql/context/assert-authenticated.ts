import { AuthenticationError } from "apollo-server-lambda";
import { APIGatewayEvent } from "aws-lambda";

import {
  get as getSession,
  namespaceKeys,
} from "~/lib/session-management-service";
import getTenantId from "./get-tenant-id";
import getUserId from "./get-user-id";

const assertValidJwt = async (event: APIGatewayEvent) => {
  const token = event.headers.Authorization.replace("Bearer ", "");
  // jwt signature is a much smaller unique identifier than the entire jwt
  const signature = token.split(".")[2];
  const namespace = `${namespaceKeys.JWT_SIGNATURE}:${signature}`;

  const result = await getSession({ namespace });

  if (result?.namespace === namespace) {
    throw new AuthenticationError("Invalid JWT");
  }
};

export default async (event: APIGatewayEvent) => {
  const tenantId = getTenantId(event);
  const userId = getUserId(event);

  if (!tenantId || !userId) {
    throw new AuthenticationError("Unauthenticated");
  }

  await assertValidJwt(event);
};
