import { SQSEvent, SQSRecord } from "aws-lambda";
import { format } from "date-fns";
import jsonStore from "~/lib/s3";

const { put: putSqsDlq } = jsonStore<SQSRecord>(process.env.SQS_DLQ_BUCKET);

const handle = (ev: SQSEvent) => {
  ev.Records.map(async (record) => {
    await putSqsDlq(
      `${format(new Date(), "yyyy-MM-dd")}/${record.eventSourceARN}/${
        record.messageId
      }.json`,
      record
    );
  });
};

export { handle };
