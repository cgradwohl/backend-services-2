import { toUuid } from "~/lib/api-key-uuid";
import assertStateIsValid from "~/lib/assertions/is-valid-scope-state";
import { get as getEventMap } from "~/lib/event-maps";
import { HttpError } from "~/lib/http-errors";
import { PublishedState } from "~/send/types";
import { INotificationWire } from "~/types.api";
import getLatestDraft from "~/workers/lib/get-latest-draft";
import getNotificationLegacy from "~/workers/lib/get-notification";

const getNotificationSafe = async ({
  id,
  tenantId,
}: {
  id: string;
  tenantId: string;
}) => {
  try {
    const notification = await getNotificationLegacy(tenantId, id);
    return notification;
  } catch (err) {
    if ((err as HttpError).statusCode === 404) {
      return undefined;
    }
    console.error(err);
    throw err;
  }
};

const getNotificationDraftSafe = async ({
  id,
  tenantId,
}: {
  id: string;
  tenantId: string;
}) => {
  try {
    const notification = await getLatestDraft(tenantId, id);
    return notification;
  } catch (err) {
    if ((err as HttpError).statusCode === 404) {
      return undefined;
    }
    console.error(err);
    throw err;
  }
};

const getNotificationSubmittedSafe = async ({
  id,
  tenantId,
}: {
  id: string;
  tenantId: string;
}) => {
  try {
    const notification = await getLatestDraft(tenantId, id);

    const { canceled, checkConfigs, submitted } = notification.json;

    // use most recent draft if checks are enabled and it was submitted but not canceled
    if (checkConfigs?.[0].enabled && submitted && submitted > (canceled ?? 0)) {
      return notification as INotificationWire;
    }

    // else use published
    return await getNotificationSafe({ id, tenantId });
  } catch (err) {
    if ((err as HttpError).statusCode === 404) {
      return undefined;
    }
    console.error(err);
    throw err;
  }
};

const getScopedNotification = async (
  id: string,
  tenantId: string,
  state: "published" | "draft" | "submitted"
) => {
  switch (state) {
    case "published": {
      return getNotificationSafe({
        id,
        tenantId,
      });
    }
    case "draft": {
      return getNotificationDraftSafe({ id, tenantId });
    }
    case "submitted": {
      return getNotificationSubmittedSafe({ id, tenantId });
    }
  }
};

const getNotificationByEventMap = async (
  tenantId: string,
  eventId: string,
  state: PublishedState
) => {
  const eventMap = await getEventMap({
    eventId,
    tenantId,
  });

  const notificationId = eventMap?.notifications?.[0]?.notificationId;

  if (!notificationId) {
    return;
  }

  // TODO: need to cache this result
  return getScopedNotification(notificationId, tenantId, state);
};

const fromApiKey = (eventId: string): string | undefined => {
  try {
    return toUuid(eventId);
  } catch (err) {
    // do nothing
  }

  return;
};

const getNotificationByApiKey = async (
  tenantId: string,
  eventId: string,
  state: PublishedState
) => {
  const notificationId = fromApiKey(eventId);

  if (!notificationId) {
    return undefined;
  }

  return getScopedNotification(notificationId, tenantId, state);
};

const getNotification = async (
  tenantId: string,
  eventId: string,
  scope: string
): Promise<INotificationWire | undefined> => {
  const [state] = scope?.split("/") ?? ["published"];
  assertStateIsValid(state);

  const notification =
    (await getNotificationByEventMap(tenantId, eventId, state)) ??
    (await getNotificationByApiKey(tenantId, eventId, state));

  if (notification?.archived) {
    return;
  }

  return notification;
};

export default getNotification;
