import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";

export function mapUserIdFromIdPathParam(
  event: APIGatewayRequestAuthorizerEvent
): string {
  const id = event.pathParameters?.id;
  if (!id) {
    throw new Error("Unauthorized");
  }

  return event.pathParameters?.id;
}
