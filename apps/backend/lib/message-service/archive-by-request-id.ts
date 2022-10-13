import { putEvents } from "~/lib/eventbridge";
import { MessageArchiveEventDetailType } from "~/messages/types/api-v1/message";

const archiveByRequestId = async (
  workspaceId: string,
  requestId: string
): Promise<void> => {
  await putEvents([
    {
      Detail: JSON.stringify({
        requestId,
        workspaceId,
      }),
      DetailType: MessageArchiveEventDetailType,
      Source: "courier.api",
    },
  ]);
};

export default archiveByRequestId;
