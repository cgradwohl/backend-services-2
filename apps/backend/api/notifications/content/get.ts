import { get as getNotification } from "~/lib/notification-service";
import { getLatestDraft } from "~/lib/notification-service/draft";

import { toUuid } from "~/lib/api-key-uuid";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { GetFn } from "../types";
import { transformResponse } from "./transforms/get";

const get: GetFn = async (context) => {
  const { tenantId } = context;
  const id = assertPathParam(context, "id");
  const isDraft =
    context.event.resource === "/notifications/{id}/draft/content";

  const notificationId = toUuid(id);
  if (isDraft) {
    const draft = await getLatestDraft({
      tenantId,
      notificationId,
    });

    if (!draft) {
      throw new NotFound();
    }

    const body = transformResponse(draft);
    return { body };
  }

  const notification = await getNotification({
    tenantId,
    id: notificationId,
  });

  if (!notification) {
    throw new NotFound();
  }

  const body = transformResponse(notification);
  return { body };
};

export default get;
