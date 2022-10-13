import { Context } from "aws-lambda";
import AWS from "aws-sdk";
import { query } from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import putListIntoES from "~/lib/elastic-search/recipients/put-list-recipient";
import { IListItem } from "~/triggers/event-bridge/put-into-es";

const ObjectsTableName = getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME);

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });

const handle = async (event: any, context: Context) => {
  const { tenantId, nextObjectKey } = event;
  const { functionName } = context;

  if (process.env.KILL_PROCESS) {
    // tslint:disable-next-line: no-console
    console.log("process aborted by environment varaible");
    return;
  }

  /*
   1. use the tenant and invoke a lambda with tableName as object table name, -> exclusively getting lists for that tenant
   2. if that execution runs out of time, then invoke the same lambda again with LastEvaluatedKey for the query
  */

  const { Items: scannedObjects, LastEvaluatedKey: LastEvaluatedObjectsKey } =
    await query({
      ExclusiveStartKey: nextObjectKey,
      Limit: 1000,
      IndexName: "by-objtype-index",
      TableName: ObjectsTableName,
      ExpressionAttributeNames: {
        "#tenantId": "tenantId",
        "#objtype": "objtype",
      },
      ExpressionAttributeValues: {
        ":tenantId": tenantId,
        ":objtype": "list",
      },
      KeyConditionExpression: "#tenantId = :tenantId AND #objtype = :objtype",
    });

  // Do the work of putting the list items into ES
  await Promise.allSettled(
    scannedObjects.map(async (list: IListItem) => {
      try {
        const listId = list.id.startsWith("list/")
          ? (list.id as string).split("list/").pop()
          : list.id;

        const { Count: listSubscriptionCount } = await query({
          Limit: 1000,
          TableName: ObjectsTableName,
          ExpressionAttributeNames: {
            "#tenantId": "tenantId",
            "#id": "id",
          },
          ExpressionAttributeValues: {
            ":tenantId": tenantId,
            ":id": `${list.id}/subscription/`,
          },
          KeyConditionExpression:
            "#tenantId = :tenantId AND begins_with(#id, :id)",
        });

        console.log(
          `putting list into elastic search: ${JSON.stringify(list)}`
        );
        console.log("count is: ", listSubscriptionCount);
        await putListIntoES({
          tenantId: list.tenantId,
          title: list.title,
          count: listSubscriptionCount,
          id: listId,
          updated: list.updated,
          objtype: list.objtype,
          archived: list.archived,
          json: list.json,
        });
      } catch (error) {
        // tslint:disable-next-line: no-console
        console.log(`failed to put list into ES ${list.id}`, error);
      }
    })
  );
  // make the recursive call to process remainder of the objects in a given tenant
  if (LastEvaluatedObjectsKey) {
    // call this function again but do not wait for response
    console.log(`invoking ${functionName} again for ${tenantId}`);
    lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event", // don't wait for response
        Payload: JSON.stringify({
          tenantId,
          TableName: ObjectsTableName,
          nextObjectKey: LastEvaluatedObjectsKey,
          filename:
            "stream-existing-lists-to-elasticsearch-recipients_2022_01_28",
        }),
      })
      .promise();
  }
};

export default handle;
