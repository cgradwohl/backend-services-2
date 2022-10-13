import { APIGatewayTokenAuthorizerEvent, Context } from "aws-lambda";
import {
  authorizeApiKey,
  getAuthTokenFromAuthEvent,
  unauthorizedMessage,
} from "~/lib/authorizers";
import { error } from "~/lib/log";
import captureException from "~/lib/capture-exception";

export async function api(
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
) {
  try {
    const apiKey = getAuthTokenFromAuthEvent(event);
    if (!apiKey) {
      throw new Error(unauthorizedMessage);
    }

    return await authorizeApiKey({
      apiKey,
      methodArn: event.methodArn,
      awsRequestId: context.awsRequestId,
    });
  } catch (err) {
    if (err.message !== unauthorizedMessage) {
      error(err);
      await captureException(err, { request: event });
    }

    throw err;
  }
}
