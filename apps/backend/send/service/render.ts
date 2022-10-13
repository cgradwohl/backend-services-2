import { nanoid } from "nanoid";
import { putRecord } from "~/lib/kinesis";
import { IRenderRecord, IRenderProviderPayload, RenderService } from "../types";

const PROVIDER_RENDER_STREAM_NAME = process.env.PROVIDER_RENDER_STREAM;

const renderService: RenderService = (tenantId: string) => {
  return {
    emit: async (action: IRenderProviderPayload) => {
      await putRecord<IRenderRecord>({
        Data: {
          command: "render",
          channel: action.channel,
          channelId: action.channelId,
          configurationId: action.configurationId,
          contextFilePath: action.contextFilePath,
          dryRunKey: action.dryRunKey,
          messageFilePath: action.messageFilePath,
          messageId: action.messageId,
          requestId: action.requestId,
          tenantId,
          address: action.address,
          times: action.times,
          shouldVerifyRequestTranslation:
            action?.shouldVerifyRequestTranslation ?? false,
          translated: action?.translated ?? false,
        },
        PartitionKey: nanoid(),
        StreamName: PROVIDER_RENDER_STREAM_NAME!,
      });
    },
  };
};

export default renderService;
