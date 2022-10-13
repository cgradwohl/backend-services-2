import { DynamoDBRecord, KinesisStreamRecord } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { IDDBAudience } from "~/audiences/stores/dynamo/types";
import { encode } from "~/lib/base64";
import putAudienceRecipientIntoES, {
  es,
} from "~/lib/elastic-search/recipients/put-audience-recipient";
import { createEventHandlerWithoutSequenceChecking } from "~/lib/kinesis/create-event-handler";
import kinesisToJson from "~/lib/kinesis/to-json";
import logger from "~/lib/logger";

async function handleRecord(record: KinesisStreamRecord) {
  const item = kinesisToJson<DynamoDBRecord>(record.kinesis.data);
  const eventName = item.eventName;
  try {
    if (eventName === "REMOVE") {
      const deletedAudience = DynamoDB.Converter.unmarshall(
        item.dynamodb.OldImage
      );
      const esRecipientId = encode(
        `${deletedAudience.workspaceId}/${deletedAudience.audienceId}`
      );
      await es.delete(esRecipientId);
      return;
    }

    const updatedAudience = DynamoDB.Converter.unmarshall(
      item.dynamodb.NewImage
    );

    if (!updatedAudience) {
      return;
    }
    await putAudienceRecipientIntoES(updatedAudience as IDDBAudience);
    logger.debug(
      `Audience a/${updatedAudience.workspaceId}/${updatedAudience.audienceId} updated in ES`
    );
  } catch (err) {
    console.error(
      `Error performing ${eventName} from elasticSearch`,
      JSON.stringify(err, null, 2)
    );
  }
}

export default createEventHandlerWithoutSequenceChecking(handleRecord);
