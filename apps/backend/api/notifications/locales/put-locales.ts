import { get as getNotification } from "~/lib/notification-service";
import { getLatestDraft } from "~/lib/notification-service/draft";

import { toUuid } from "~/lib/api-key-uuid";
import { NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { merge as mergeNotification } from "~/lib/notification-service";
import { put as putLocales } from "~/lib/notification-service/locales";
import { IApiNotificationPostLocalesRequest } from "~/types.public";
import { PutFn } from "../types";
import { transformRequest } from "./transforms/post";

const put: PutFn = async (context) => {
  const { tenantId } = context;
  const id = assertPathParam(context, "id");
  const body = assertBody<IApiNotificationPostLocalesRequest>(context);
  const isDraft =
    context.event.resource === "/notifications/{id}/draft/locales";

  const notificationId = toUuid(id);
  if (isDraft) {
    const draft = await getLatestDraft({
      notificationId,
      tenantId,
    });

    if (!draft) {
      throw new NotFound();
    }

    await putLocales({
      id: draft.json.draftId ?? notificationId,
      locales: transformRequest(draft, body?.blocks, body?.channels),
      tenantId,
    });

    await mergeNotification(
      {
        id: notificationId,
        tenantId,
      },
      {
        json: {
          localesConfig: {
            enabled: true,
          },
        },
      }
    );

    return {
      status: 204,
    };
  }

  const notification = await getNotification({
    id: notificationId,
    tenantId,
  });

  await putLocales({
    id: notificationId,
    locales: transformRequest(notification, body?.blocks, body?.channels),
    tenantId,
  });

  await mergeNotification(
    {
      id: notificationId,
      tenantId,
    },
    {
      json: {
        localesConfig: {
          enabled: true,
        },
      },
    }
  );

  return {
    status: 204,
  };
};

export default put;
