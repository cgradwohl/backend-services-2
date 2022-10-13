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
import { IApiNotificationPutLocaleRequest } from "~/types.public";
import { PutFn } from "../types";
import { transformRequest } from "./transforms/put";

const put: PutFn = async (context) => {
  const { tenantId } = context;
  const id = assertPathParam(context, "id");
  const localeId = assertPathParam(context, "localeId");
  const body = assertBody<IApiNotificationPutLocaleRequest>(context);
  const isDraft =
    context.event.resource === "/notifications/{id}/draft/locales/{localeId}";

  const notificationId = toUuid(id);

  if (isDraft) {
    const draft = await getLatestDraft({
      tenantId,
      notificationId,
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
      localeId,
      currentLocales,
      body.blocks,
      body.channels
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
    localeId,
    currentLocales,
    body.blocks,
    body.channels
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

export default put;
