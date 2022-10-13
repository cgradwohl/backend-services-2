import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as dynamo from "~/lib/dynamo";
import { ITenantAccessRight } from "~/lib/tenant-access-rights-service/types";
import { Handler, IDataFixEvent } from "./types";

import { subscribeInApp } from "~/lib/courier-in-app";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  exclusiveStartKey?: DocumentClient.Key;
}

const handler: Handler<IEvent> = async (event, context) => {
  const {
    Items: items,
    LastEvaluatedKey: lastEvaluatedKey,
  } = await dynamo.scan({
    ExclusiveStartKey: event.exclusiveStartKey,
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
      await subscribeInApp(item.userId, item.tenantId);
    })
  );
};

export default handler;
