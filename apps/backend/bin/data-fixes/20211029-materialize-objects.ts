import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as dynamodb from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import materializedObjects from "~/objects/services/materialized-objects";
import { CourierObject } from "~/types.api";
import { Handler, IDataFixEvent } from "./types";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  tenantId: string;
  objtype: string;
  lastEvaluatedKey?: DocumentClient.Key;
}

const handler: Handler<IEvent> = async (event, context) => {
  if (process.env.KILL_PROCESS) {
    console.log("process aborted by environment varaible");
    return;
  }

  const { tenantId, objtype, lastEvaluatedKey } = event;
  const objects = materializedObjects(tenantId);
  const shouldMaterializeObject = objects.shouldMaterializeObject(objtype);

  if (!shouldMaterializeObject) {
    return;
  }

  const results = await dynamodb.query({
    ExclusiveStartKey: lastEvaluatedKey,
    ExpressionAttributeValues: {
      ":objtype": objtype,
      ":tenantId": tenantId,
    },
    IndexName: "by-objtype-index",
    KeyConditionExpression: "tenantId = :tenantId AND objtype = :objtype",
    Limit: 20,
    TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
  });

  console.log("results", JSON.stringify(results, null, 2));

  const { LastEvaluatedKey } = results;
  const items = results.Items as CourierObject[];

  for (const item of items) {
    try {
      // do not overwrite older versions of brand
      if ("brand:version" === objtype) {
        // sadly we have to do `any` because `version` is not attributed to any of the types
        // id looks like brand/5784cc53-4770-4a75-9217-33a1944a5818/version/2021-10-14T08:32:09.653Z
        const latestBrand = (await objects.get(item.id.split("/")[1], {
          latest: true,
        })) as any;

        if (!!latestBrand && (item as any).version < latestBrand.version) {
          console.log(
            `do not overwrite brand:version ${latestBrand.version} with ${
              (item as any).version
            }`
          );
          continue;
        }
        console.log(
          `overwrite brand:version ${latestBrand?.version} with ${
            (item as any).version
          }`
        );
      }
      await objects.save({
        ...item,
        json: typeof item.json === "string" ? JSON.parse(item.json) : item.json,
      });
      console.log("Successfully saved item", item.id);
    } catch (err) {
      console.error("Failed to save item", item.id, err);
    }
  }

  if (LastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          ...event,
          lastEvaluatedKey: LastEvaluatedKey,
        }),
      })
      .promise();
  }
};

export default handler;
