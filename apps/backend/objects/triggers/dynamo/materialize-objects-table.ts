import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import * as dynamodb from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import dynamoToJson from "~/lib/dynamo/to-json";
import materializedObjects from "~/objects/services/materialized-objects";
import { CourierObject } from "~/types.api";

async function handleRecord(record: DynamoDBRecord) {
  if (record.eventName === "REMOVE") {
    return;
  }

  const { objtype, tenantId } = dynamoToJson<CourierObject>(
    record.dynamodb.NewImage
  );
  const objects = materializedObjects(tenantId);
  const shouldMaterializeObject = objects.shouldMaterializeObject(objtype);

  if (!shouldMaterializeObject) {
    return;
  }

  const key = DynamoDB.Converter.unmarshall(record.dynamodb.Keys);
  const { Item: item } = await dynamodb.getItem({
    ConsistentRead: true,
    Key: key,
    TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
  });

  if (!item) {
    return;
  }

  const courierObject = item as CourierObject;
  await objects.save({
    ...courierObject,
    json:
      typeof courierObject.json === "string"
        ? JSON.parse(courierObject.json)
        : courierObject.json,
  });
}

export async function handle(event: DynamoDBStreamEvent): Promise<void> {
  await Promise.all(event.Records.map(handleRecord));
}
