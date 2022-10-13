import { SQSEvent } from "aws-lambda";

import { ListSendTypes } from "~/api/lists/send";
import jsonStore from "~/lib/s3";
import handleSendList from "./list";
import handleSendPattern from "./pattern";

import {
  S3SendListOrPatternMessage,
  SqsSendListOrPatternMessage,
} from "~/types.internal";

const { get: getListOrPatternMessage } = jsonStore<S3SendListOrPatternMessage>(
  process.env.S3_MESSAGES_BUCKET
);

const handle = async (ev: SQSEvent) => {
  for (const record of ev.Records) {
    try {
      const body = JSON.parse(record.body) as SqsSendListOrPatternMessage;
      const path = body.messageLocation.path as string;
      const s3Message = await getListOrPatternMessage(path);

      switch (body.type) {
        case ListSendTypes.list:
          await handleSendList(body, s3Message);
          break;

        case ListSendTypes.pattern:
          await handleSendPattern(body, s3Message);
          break;
      }
    } catch (e) {
      throw e;
    }
  }
};

export { handle };
