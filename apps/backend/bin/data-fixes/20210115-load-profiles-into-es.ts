import AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import log from "~/lib/log";
import { scan } from "../../lib/dynamo";
import { Handler, IDataFixEvent } from "./types";
const TableName = getTableName(TABLE_NAMES.PROFILES_TABLE_NAME);
const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
interface IEvent extends IDataFixEvent {
  exclusiveStartKey?: DocumentClient.Key;
}
const handler: Handler<IEvent> = async (event, context) => {
  const res = await scan({
    ExclusiveStartKey: event.exclusiveStartKey,
    Limit: 100,
    TableName,
  });
  if (!res.Items || res.Items.length === 0) {
    log("No items found");
    return;
  }

  await lambda
    .invoke({
      FunctionName: process.env.DYNAMO_TABLE_STREAM_HANDLER,
      Payload: JSON.stringify({
        Records: res.Items.map((item) => ({
          kinesis: {
            data: Buffer.from(
              JSON.stringify({
                NewImage: AWS.DynamoDB.Converter.marshall(item),
                table: "recipients",
              })
            ).toString("base64"),
          },
        })),
      }),
    })
    .promise();

  if (res.LastEvaluatedKey) {
    log(`More records to scan. Calling ${context.functionName} again...`);
    // call this function again but do not wait for response
    await lambda
      .invoke({
        FunctionName: context.functionName,
        InvocationType: "Event", // don't wait for response
        Payload: JSON.stringify({
          ...event,
          exclusiveStartKey: res.LastEvaluatedKey,
        }),
      })
      .promise();
  }
};
export default handler;
