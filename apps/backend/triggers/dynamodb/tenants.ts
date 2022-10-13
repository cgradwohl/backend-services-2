import { DynamoDBRecord } from "aws-lambda";
import { createStreamHandlerWithFailures } from "~/lib/dynamo/create-stream-handler";
import dynamoToJson from "~/lib/dynamo/to-json";
import { createTrackingSubdomainForTenant } from "~/lib/tracking-service/create-tracking-subdomain";
import { ITenantDynamoObject } from "~/types.api";

const shouldProcess = (record: DynamoDBRecord): boolean => {
  return record.eventName === "INSERT";
};

async function handleStreamRecord(record: DynamoDBRecord) {
  // keeping this just as a safety precaution. this should never happen.
  if (!shouldProcess(record)) {
    return;
  }

  const tenant = dynamoToJson<ITenantDynamoObject>(record.dynamodb.NewImage);

  await createTrackingSubdomainForTenant(tenant.tenantId);
  await createTrackingSubdomainForTenant(`${tenant.tenantId}-test`);
}

export default createStreamHandlerWithFailures(
  handleStreamRecord,
  process.env.TENANT_SEQUENCE_TABLE,
  {
    filter: (record: DynamoDBRecord) => shouldProcess(record),
  }
);
