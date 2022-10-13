import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import {
  authorizeClientJwt,
  authorizeClientKey,
  getAuthTokenFromAuthEvent,
  unauthorizedMessage,
} from "~/lib/authorizers";
import captureException from "~/lib/capture-exception";
import logger from "~/lib/logger";
import { decode as decodeJwt } from "jsonwebtoken";

export async function api(event: APIGatewayRequestAuthorizerEvent) {
  try {
    const authToken = getAuthTokenFromAuthEvent(event);
    const decoded = decodeJwt(authToken ?? "");
    const isClientJwtRequest = decoded instanceof Object;

    if (isClientJwtRequest) {
      return await authorizeClientJwt({
        methodArn: event.methodArn,
        jwt: authToken,
      });
    }

    return await authorizeClientKey({
      methodArn: event.methodArn,
      headers: event.headers,
    });
  } catch (err) {
    if (err.message !== unauthorizedMessage) {
      logger.error(err);
      await captureException(err, { request: event });
    }
    throw err;
  }
}
