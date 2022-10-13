import { S3Event, S3EventRecord } from "aws-lambda";
import { create } from "~/lib/dynamo/event-logs";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";
import store from "~/reprocessors/stores/s3/events";
import { IReprocessorPayload } from "~/reprocessors/types";
import { IEventReprocessorPayload } from "~/reprocessors/types/events";

const getObject = async (record: S3EventRecord): Promise<IReprocessorPayload> =>
  store.get(record.s3.object.key);

const handleRecord = async (record: S3EventRecord) => {
  const payload = await getObject(record);
  if (!payload) {
    console.warn(
      "Could not find payload for reprocessing",
      record.s3.object.key
    );
    return;
  }

  const reprocessorType = payload.metadata.type;

  switch (reprocessorType) {
    case "event": {
      const { tenantId, messageId, type, json, ts } = (
        payload as IEventReprocessorPayload
      ).input;

      const reprocessorEnabled = await getFeatureTenantVariation(
        "Reprocessing_Nov-2021_recreate-event-log",
        tenantId
      );
      if (!reprocessorEnabled) {
        return;
      }
      // tslint:disable-next-line: no-console
      console.log(`Reprocessing payload :- ${JSON.stringify(payload)}`);
      await create(tenantId, messageId, type, json, ts);
      break;
    }
    default: {
      // tslint:disable-next-line: no-console
      console.log(`Reprocessor type ${reprocessorType} not supported`);
    }
  }
};

const worker = async (event: S3Event) => {
  // tslint:disable-next-line: no-console
  console.log("event records length", event.Records.length);
  await Promise.all(event.Records.map(handleRecord));
};

export { worker };
