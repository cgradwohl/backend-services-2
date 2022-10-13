import { DynamoDBRecord } from "aws-lambda";
import DynamoDB from "aws-sdk/clients/dynamodb";
import { encode } from "~/lib/base64";
import captureException from "~/lib/capture-exception";
import { createStreamHandlerWithoutSequenceChecking } from "~/lib/dynamo/create-stream-handler";
import { IProfileObject } from "~/lib/dynamo/profiles";
import putRecipientIntoES, {
  es,
} from "~/lib/elastic-search/recipients/put-profile-recipient";
import logger from "~/lib/logger";

async function handleRecord(record: DynamoDBRecord) {
  const key = DynamoDB.Converter.unmarshall(record.dynamodb.Keys);

  try {
    if (record.eventName === "REMOVE") {
      const deletedProfile = DynamoDB.Converter.unmarshall(
        record.dynamodb.OldImage
      ) as IProfileObject;
      const esRecipientId = encode(`${deletedProfile.tenantId}/${key.id}`);
      logger.debug(`Deleting recipient ${esRecipientId}`);

      await es.delete(esRecipientId);
      return;
    }

    const profileUpdates = DynamoDB.Converter.unmarshall(
      record.dynamodb.NewImage
    );

    if (!profileUpdates) {
      return;
    }

    await putRecipientIntoES(profileUpdates as IProfileObject);
  } catch (err) {
    // tslint:disable-next-line: no-console
    console.error("Elastic search deletion Failed", err);
    await captureException(err);
  }
}

export default createStreamHandlerWithoutSequenceChecking(handleRecord);
