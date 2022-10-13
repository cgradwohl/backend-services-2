import { APIGatewayEvent } from "aws-lambda";

const getEnv = (event: APIGatewayEvent) => {
  return event.queryStringParameters?.env;
};

export default getEnv;
