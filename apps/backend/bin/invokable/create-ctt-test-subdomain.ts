import AWS from "aws-sdk";
import { scan } from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import log from "~/lib/log";
import { createTrackingSubdomainForTenant } from "~/lib/tracking-service/create-tracking-subdomain";

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });

export const handle = async ({ next }, { functionName }) => {
  const res = await scan({
    ExclusiveStartKey: next,
    Limit: 100,
    TableName: getTableName(TABLE_NAMES.TENANTS_TABLE_NAME),
  });

  const tenantCount = res.Items?.length ?? 0;

  if (tenantCount === 0) {
    log("No items found");
    return;
  }

  log(`Creating test subdomains for ${tenantCount} tenants`);
  for (const { name: tenantName, tenantId } of res.Items) {
    log(`Creating subdomain for ${tenantName} [${tenantId}]`);
    await createTrackingSubdomainForTenant(`${tenantId}-test`);
  }

  // more records to scan?
  if (res.LastEvaluatedKey) {
    log(`More records to scan. Calling ${functionName} again...`);
    // call this function again but do not wait for response
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event", // don't wait for response
        Payload: JSON.stringify({ next: res.LastEvaluatedKey }),
      })
      .promise();
  }
};
