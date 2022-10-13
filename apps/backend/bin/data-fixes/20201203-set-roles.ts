import { Context } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import * as dynamo from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { setRole } from "~/lib/tenant-access-rights-service";
import { ITenantAccessRight } from "~/lib/tenant-access-rights-service/types";
import { get as getTenant } from "~/lib/tenant-service";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface ISetRoleHandlerEvent {
  lastEvaluatedKey?: DocumentClient.Key;
}

type SetRoleHandlerFn = (
  event: ISetRoleHandlerEvent,
  context: Context
) => Promise<void>;

export const handle: SetRoleHandlerFn = async (event, context) => {
  const results = await dynamo.scan({
    ExclusiveStartKey: event.lastEvaluatedKey,
    TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
  });

  if (results.LastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          ...event,
          lastEvaluatedKey: results.LastEvaluatedKey,
        }),
      })
      .promise();
  }

  await Promise.all(
    (results.Items as ITenantAccessRight[]).map(async (item) => {
      const tenant = await getTenant(item.tenantId);
      const ownerId = tenant.owner ?? tenant.creator;
      const role = item.userId === ownerId ? "ADMINISTRATOR" : "MANAGER";
      await setRole(item.tenantId, item.userId, role, undefined);
    })
  );
};
