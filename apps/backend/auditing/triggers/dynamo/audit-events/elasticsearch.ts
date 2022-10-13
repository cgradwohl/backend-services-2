import { DynamoDBRecord } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { IDDBAuditEvent } from "~/auditing/stores/dynamo/types";
import { put } from "~/auditing/stores/elasticsearch/audit-events";
import { createStreamHandlerWithoutSequenceChecking } from "~/lib/dynamo/create-stream-handler";

const handleStreamRecord = async (record: DynamoDBRecord): Promise<void> => {
  // audit events should be immutable
  if (record.eventName !== "INSERT") {
    return;
  }

  const auditEvent = DynamoDB.Converter.unmarshall(
    record.dynamodb.NewImage
  ) as IDDBAuditEvent;

  await put(auditEvent);
};

export default createStreamHandlerWithoutSequenceChecking(
  async (record: DynamoDBRecord) => {
    await handleStreamRecord(record);
  }
);
