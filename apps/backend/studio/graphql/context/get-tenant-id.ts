import { APIGatewayEvent } from "aws-lambda";

const getTenantId = (event: APIGatewayEvent) => {
  return event.queryStringParameters?.tenantId;
};

export default getTenantId;
