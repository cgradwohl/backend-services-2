import { KinesisStreamEvent, KinesisStreamRecord } from "aws-lambda";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import { AutomationRun } from "~/automations/entities/run/run.entity";
import { AutomationEntity } from "~/automations/entities/types";

import { IAutomationDynamoItem } from "~/automations/types";
import captureException from "~/lib/capture-exception";
import dynamoToJson from "~/lib/dynamo/to-json";
import putAutomationRunsIntoES from "~/lib/elastic-search/put-automation-runs";
import kinesisToJson from "~/lib/kinesis/to-json";

interface IDynamoRecordChange {
  eventName: "INSERT" | "MODIFY" | "REMOVE";
  tableName: string;
  dynamodb: {
    ApproximateCreationDateTime: number;
    Keys: AttributeMap;
    NewImage?: AttributeMap;
    OldImage?: AttributeMap;
    SizeBytes: number;
  };
  eventSource: "aws:dynamodb";
}

async function handleRecord(record: KinesisStreamRecord) {
  const data = kinesisToJson<IDynamoRecordChange>(record.kinesis.data);

  const automationItem = dynamoToJson<IAutomationDynamoItem>(
    data.dynamodb.NewImage
  );

  if (
    automationItem?.type !== "automation-run" &&
    (automationItem as unknown as AutomationRun)?.___type___ !==
      AutomationEntity.Run
  ) {
    return;
  }

  await putAutomationRunsIntoES(automationItem);
}

export const handler = async (event: KinesisStreamEvent) => {
  let sequenceNumber: string;

  try {
    for (const record of event.Records) {
      sequenceNumber = record.kinesis.sequenceNumber;
      await handleRecord(record);
    }
  } catch (err) {
    console.error(err);
    await captureException(err);

    return {
      batchItemFailures: [
        {
          itemIdentifier: sequenceNumber,
        },
      ],
    };
  }
};
