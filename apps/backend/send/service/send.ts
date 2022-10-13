import { nanoid } from "nanoid";
import { putRecord } from "~/lib/kinesis";
import { ISendProviderPayload, ISendRecord, SendService } from "../types";

const sendService: SendService = (tenantId: string) => {
  return {
    emit: async (payload: ISendProviderPayload) => {
      await putRecord<ISendRecord>({
        Data: {
          ...payload,
          tenantId,
          translated: payload?.translated ?? false,
        },
        PartitionKey: nanoid(),
        StreamName: process.env.PROVIDER_SEND_STREAM!,
      });
    },
  };
};

export default sendService;
