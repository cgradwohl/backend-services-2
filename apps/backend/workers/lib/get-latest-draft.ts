import { INotificationWire } from "~/types.api";
import getDraft from "./get-draft";
import getNotification from "./get-notification";

type GetLatestDraft = (
  tenantId: string,
  notificationId: string
) => Promise<INotificationWire>;

const getLatestDraft: GetLatestDraft = async (tenantId, notificationId) => {
  const publishedNotification = await getNotification(tenantId, notificationId);

  if (publishedNotification.json.draftId) {
    const draft = await getDraft(tenantId, publishedNotification.json.draftId);

    publishedNotification.json = {
      ...publishedNotification.json,
      blocks: draft.json.blocks,
      brandConfig: draft.json.brandConfig,
      canceled: draft.json.canceled,
      channels: draft.json.channels,
      submitted: draft.json.submitted,
    };
  }

  return publishedNotification;
};

export default getLatestDraft;
