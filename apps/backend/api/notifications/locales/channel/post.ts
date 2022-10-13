import { get as getNotification } from "~/lib/notification-service";
import { getLatestDraft } from "~/lib/notification-service/draft";

import { toUuid } from "~/lib/api-key-uuid";
import { NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { merge as mergeNotification } from "~/lib/notification-service";
import {
  get as getLocales,
  put as putLocales,
} from "~/lib/notification-service/locales";
import { IApiNotificationPutChannelLocales } from "~/types.public";
import { PostFn } from "../../types";
import { transformRequest } from "../transforms/channel/put";

const post: PostFn = async (context) => {
  const { tenantId } = context;
  const id = assertPathParam(context, "id");
  const channelId = assertPathParam(context, "channelId");
  const body = assertBody<IApiNotificationPutChannelLocales>(context);
  const isDraft =
    context.event.resource ===
    "/notifications/{id}/draft/channel/{channelId}/locales";

  const notificationId = toUuid(id);

  if (isDraft) {
    const draft = await getLatestDraft({
      notificationId,
      tenantId,
    });

    if (!draft) {
      throw new NotFound();
    }

    const currentLocales = await getLocales({
      id: draft.id ?? notificationId,
      tenantId,
    });

    const updatedLocales = transformRequest(
      draft,
      channelId,
      currentLocales,
      body
    );

    await putLocales({
      id: draft.json.draftId ?? notificationId,
      locales: updatedLocales,
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

  const currentLocales = await getLocales({
    id: notificationId,
    tenantId,
  });

  const updatedLocales = transformRequest(
    notification,
    channelId,
    currentLocales,
    body
  );

  await putLocales({
    id: notificationId,
    locales: updatedLocales,
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

export default post;
