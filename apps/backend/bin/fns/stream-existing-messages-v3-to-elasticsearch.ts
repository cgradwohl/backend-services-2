import AWS from "aws-sdk";
import elasticSearch from "~/lib/elastic-search";
import getEnvVar from "~/lib/get-environment-variable";
import log from "~/lib/log";
import { scan } from "../../lib/dynamo";

const TableName = getEnvVar("MESSAGES_V3_TABLE");
const endpoint = getEnvVar("ELASTIC_SEARCH_ENDPOINT");
const index = getEnvVar("MESSAGES_V3_ELASTIC_SEARCH_INDEX");
const lambda = new AWS.Lambda({ apiVersion: "2015-03-31" });
const es = elasticSearch(endpoint, index);

export const handle = async ({ next, enqueuedAfter }, { functionName }) => {
  if (process.env.KILL_PROCESS) {
    // tslint:disable-next-line: no-console
    console.log("process aborted by environment variable");
    return;
  }

  if (next) {
    log("Next:", next);
  } else {
    log("Starting new record stream");
  }

  // scan in 100 records
  const { Items, LastEvaluatedKey } = await scan({
    ExclusiveStartKey: next,
    Limit: 100,
    TableName,
  });

  if (!Items || Items.length === 0) {
    log("No items found");
    return;
  }

  const enqueuedAfterMs = enqueuedAfter ? new Date(enqueuedAfter).getTime() : 0;

  log(`Streaming ${Items.length} items`);
  await Promise.all(
    Items.map(async (item) => {
      if (enqueuedAfter && item.enqueued < enqueuedAfterMs) {
        return;
      }

      try {
        es.put(item.messageId, item);
      } catch (error) {
        console.error(
          `failed to re-index message with id ${item.messageId}`,
          error
        );
      }
    })
  );

  // more records to scan?
  if (LastEvaluatedKey) {
    log(`More records to scan. Calling ${functionName} again...`);
    // call this function again but do not wait for response
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event", // don't wait for response
        Payload: JSON.stringify({ next: LastEvaluatedKey, enqueuedAfter }),
      })
      .promise();
  }
};
