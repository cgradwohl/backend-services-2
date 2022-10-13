import { Context } from "aws-lambda";
import AWS from "aws-sdk";
import { scan } from "~/lib/dynamo";
import { IProfileObject } from "~/lib/dynamo/profiles";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import putRecipientIntoES from "~/lib/elastic-search/recipients/put-profile-recipient";

const TableName = getTableName(TABLE_NAMES.PROFILES_TABLE_NAME);

const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });

export const handle = async (event: any, context: Context) => {
  const { next } = event;
  const { functionName } = context;

  if (process.env.KILL_PROCESS) {
    // tslint:disable-next-line: no-console
    console.log("process aborted by environment varaible");
    return;
  }

  try {
    const { Items: scannedProfiles, LastEvaluatedKey } = await scan({
      ExclusiveStartKey: next,
      Limit: 1000,
      TableName,
    });
    if (!scannedProfiles || scannedProfiles.length === 0) {
      return;
    }

    await Promise.allSettled(
      scannedProfiles.map(async (profile: IProfileObject) => {
        try {
          await putRecipientIntoES(profile);
        } catch (error) {
          // tslint:disable-next-line: no-console
          console.error(`failed to re-index ${profile.id}`, error);
        }
      })
    );

    // more records to scan?
    if (LastEvaluatedKey) {
      // call this function again but do not wait for response
      await lambda
        .invoke({
          FunctionName: functionName,
          InvocationType: "Event", // don't wait for response
          Payload: JSON.stringify({ next: LastEvaluatedKey }),
        })
        .promise();
    }
  } catch (error) {
    // tslint:disable-next-line: no-console
    console.error(`Error re-indexing profiles`, error);
  }
};
