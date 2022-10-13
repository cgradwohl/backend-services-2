import { getLogs } from "~/lib/dynamo/event-logs";
import { IApiMessageOutputItem } from "~/types.public";

export default async (
  tenantId,
  messageId
): Promise<IApiMessageOutputItem[]> => {
  const logs = await getLogs(tenantId, messageId);

  return logs
    .filter((log) => "provider:rendered" === log.type)
    .map((log) => {
      const { channel, renderedTemplate } = log.json ?? {};
      return {
        channel: channel?.taxonomy?.split(":")[0],
        channel_id: channel?.id,
        content: {
          ...renderedTemplate,
        },
      };
    });
};
