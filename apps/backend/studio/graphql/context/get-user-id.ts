import { APIGatewayEvent } from "aws-lambda";
import getClaim from "./get-claim";

const getUserId = (event: APIGatewayEvent) =>
  getClaim(event, "cognito:username");

export default getUserId;
