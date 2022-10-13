import { APIGatewayEvent } from "aws-lambda";

type Claim = Extract<
  keyof APIGatewayEvent["requestContext"]["authorizer"]["claims"],
  string
>;

export default (event: APIGatewayEvent, claim: Claim) =>
  event.requestContext.authorizer?.claims?.[claim];
