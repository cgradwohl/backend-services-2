import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";

import dynamoToJson from "~/lib/dynamo/to-json";
import log from "~/lib/log";
import {
  buildTenantMetricOperation,
  trackTenantMetrics,
} from "~/lib/tenant-metrics";

const aliases = {
  configuration: "integration",
  event: "template",
};
const objtypeAllowedList = ["brand", "configuration", "event", "list"];

async function handleRecord(record: DynamoDBRecord) {
  const row = dynamoToJson<any>(
    record.dynamodb.NewImage || record.dynamodb.OldImage
  );
  const tenantId = row.tenantId;
  const type = row.objtype;

  if (objtypeAllowedList.includes(type)) {
    const label = aliases[type] ?? type;

    switch (record.eventName) {
      case "INSERT":
        await trackTenantMetrics(
          [
            buildTenantMetricOperation(`${label}_count`, "INCREMENT"),
            buildTenantMetricOperation(
              `${label}_last_created`,
              "SET",
              row.created
            ),
          ],
          tenantId
        );
        break;

      case "MODIFY":
        await trackTenantMetrics(
          [
            buildTenantMetricOperation(
              `${label}_last_updated`,
              "SET",
              row.updated
            ),
          ],
          tenantId
        );

        // decrement count when archiving an object
        if (row.archived && !record.dynamodb.OldImage.archived) {
          await trackTenantMetrics(
            [buildTenantMetricOperation(`${label}_count`, "INCREMENT", -1)],
            tenantId
          );
        }
        break;

      case "REMOVE":
        // hard delete use cases
        await trackTenantMetrics(
          [buildTenantMetricOperation(`${label}_count`, "INCREMENT", -1)],
          tenantId
        );
        break;
    }
  }
}

export async function handle(event: DynamoDBStreamEvent): Promise<void> {
  await Promise.all(event.Records.map(handleRecord));
}
