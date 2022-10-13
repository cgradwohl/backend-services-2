import { DynamoDBRecord } from "aws-lambda";
import dynamoToJson from "~/lib/dynamo/to-json";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import logger from "~/lib/logger";
import { addDefaultsForPreferences } from "~/lib/preferences/add-defaults";
import { ITenantDynamoObject } from "~/types.api";

async function handleRecord(data: DynamoDBRecord) {
  const newlyAddedWorkspace = dynamoToJson<ITenantDynamoObject>(
    data.dynamodb.NewImage
  );

  const workspaceId = newlyAddedWorkspace.tenantId;
  await Promise.all([
    addDefaultsForPreferences(workspaceId),
    addDefaultsForPreferences(`${workspaceId}/test`),
  ]);
}

export default createEventHandlerWithFailures<DynamoDBRecord>(
  handleRecord,
  process.env.TenantSequenceTable
);
