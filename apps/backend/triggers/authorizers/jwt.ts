import { APIGatewayRequestAuthorizerEvent, Context } from "aws-lambda";
import { authorizeApiKey } from "~/lib/authorizers";
import { authorizeClientJwt } from "~/lib/authorizers";
import { decode as decodeJwt } from "jsonwebtoken";
import { getAuthTokenFromAuthEvent } from "~/lib/authorizers/lib";
import { error } from "console";
import captureException from "~/lib/capture-exception";
import { runJwtMiddleware } from "./lib/jwt-middleware";

/** Authorizes requests via api_key *or* client jwt if listed in client endpoints object.  */
export async function api(
  event: APIGatewayRequestAuthorizerEvent,
  context: Context
) {
  try {
    const authToken = getAuthTokenFromAuthEvent(event);
    if (!authToken) {
      throw new Error("Unauthorized");
    }

    const decoded = decodeJwt(authToken);
    const isClientJwtRequest = decoded instanceof Object;

    if (isClientJwtRequest) {
      // TODO: move this into the authorizeClientJwt fn (including the whole lib folder).
      await runJwtMiddleware(event, decoded);
      return await authorizeClientJwt({
        methodArn: event.methodArn,
        jwt: authToken,
      });
    }

    // All requests with valid API key are allowed
    return await authorizeApiKey({
      methodArn: event.methodArn,
      apiKey: authToken,
      awsRequestId: context.awsRequestId,
    });
  } catch (err) {
    if (err.message !== "Unauthorized") {
      error(err);
      await captureException(err, { request: event });
    }

    throw err;
  }
}
