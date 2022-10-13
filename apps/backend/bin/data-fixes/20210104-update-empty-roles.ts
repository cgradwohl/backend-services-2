import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as dynamo from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { setRole } from "~/lib/tenant-access-rights-service";
import { ITenantAccessRight } from "~/lib/tenant-access-rights-service/types";
import { Handler, IDataFixEvent } from "./types";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  exclusiveStartKey?: DocumentClient.Key;
}

const handler: Handler<IEvent> = async (event, context) => {
  const { Items: items, LastEvaluatedKey: lastEvaluatedKey } =
    await dynamo.scan({
      ExclusiveStartKey: event.exclusiveStartKey,
      ExpressionAttributeNames: {
        "#role": "role",
      },
      FilterExpression: "attribute_not_exists(#role)",
      TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
    });

  if (lastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          ...event,
          exclusiveStartKey: lastEvaluatedKey,
        }),
      })
      .promise();
  }

  await Promise.all(
    items.map(async (item: ITenantAccessRight) => {
      await setRole(item.tenantId, item.userId, "ADMINISTRATOR", undefined);
    })
  );
};

export default handler;
