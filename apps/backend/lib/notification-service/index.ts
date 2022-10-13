import deepExtend from "deep-extend";

import upgradeNotification from "~/lib/notifications/upgrade";
import {
  CourierObject,
  EventJsonWire,
  ILegacyNotificationWire,
  INotificationJsonWire,
} from "~/types.api";
import dynamoObjectService from "../dynamo/object-service";
import { getWelcomePrebuiltTemplate } from "../notifications/prebuilt";

import {
  IArchiveFn,
  ICreateFn,
  IGetFn,
  IListFn,
  IReplaceFn,
} from "../dynamo/object-service/types";
import { get as getTenant } from "../tenant-service";

import { list as listConfigurations } from "~/lib/configurations-service";
import {
  get as getLocales,
  put as putLocales,
} from "~/lib/notification-service/locales";
import providers from "~/providers";
import { applyLocales } from "./apply-locales";

import { warn } from "~/lib/log";

const objtype = "event";
const notificationService = dynamoObjectService<NotificationJson>(objtype);

type NotificationJson = INotificationJsonWire | EventJsonWire;
type Notification = CourierObject<NotificationJson>;
interface ICopyLocalesParams {
  destinationDraftId?: string;
  destinationEnv: string;
  destinationExists: boolean;
  notificationId: string;
  tenantId: string;
}

async function upgradeOrReturn(notification: Notification) {
  // backwards compat for required notifications

  if (notification.json?.config?.required) {
    notification.json.config.type = "REQUIRED";
  }

  if (typeof notification.json?.config?.required !== "undefined") {
    delete notification.json.config.required;
  }

  if (typeof notification.json?.config?.inheritConfig !== "undefined") {
    delete notification.json.config.inheritConfig;
  }

  return "strategyId" in notification.json
    ? upgradeNotification(notification as ILegacyNotificationWire)
    : notification;
}

async function upgradeOrReturnList(notifications: Notification[]) {
  return Promise.all(notifications.map(upgradeOrReturn));
}

// custom archive to check for item existence first
export const archive: IArchiveFn<EventJsonWire> = async ({
  id,
  tenantId,
  userId,
}) => {
  // check for item existence
  await notificationService.get({ id, tenantId });
  return notificationService.archive({ id, tenantId, userId });
};

export const create: ICreateFn<NotificationJson> = async (params, object) => {
  const { tenantId } = params;
  const tenant = await getTenant(tenantId);

  const notification: typeof object = deepExtend(
    { ...object },
    {
      json: {
        brandConfig: { enabled: tenant.brandsAccepted ? true : false },
      },
    }
  );

  const results = await notificationService.create(params, notification);
  return results as CourierObject<INotificationJsonWire>;
};

export const createPrebuiltWelcomeTemplate = async (params: {
  tenantId: string;
  userId: string;
}): Promise<CourierObject> => {
  try {
    const welcomeTemplate = await getWelcomePrebuiltTemplate();
    const configurations = await listConfigurations({
      tenantId: params.tenantId,
    });

    const emailProvider = configurations.objects.find((config) => {
      const provider = providers[config.json.provider];
      return provider?.taxonomy?.channel === "email";
    });

    if (!emailProvider || !welcomeTemplate) {
      return;
    }

    const mergeJson: Partial<NotificationJson> = {
      channels: {
        always: [],
        bestOf: [
          {
            ...welcomeTemplate.json.channels.bestOf[0],
            providers: [
              {
                configurationId: emailProvider.id,
                key: emailProvider.json.provider,
              },
            ],
          },
        ],
      },
    };

    const mergedTemplate: typeof welcomeTemplate = deepExtend(
      { ...welcomeTemplate },
      {
        id: "courier-quickstart",
        json: mergeJson,
      }
    );

    const results = await notificationService.create(params, mergedTemplate);
    return results as CourierObject<NotificationJson>;
  } catch (ex) {
    warn("error installing welcome template");
    warn(ex);
  }
};

export const count = notificationService.count;
export const duplicate = notificationService.duplicate;
export const get: IGetFn<INotificationJsonWire> = async (params) => {
  const notification = await notificationService.get(params);

  const notificationWire = (await upgradeOrReturn(
    notification
  )) as CourierObject<INotificationJsonWire>;

  const locales = await getLocales({
    tenantId: params.tenantId,
    id: notification.id,
  });

  return applyLocales({
    notification: notificationWire,
    locales,
  });
};

export const list: IListFn<INotificationJsonWire> = async (params) => {
  const { lastEvaluatedKey, objects } = await notificationService.list(params);
  const upgraded = (await upgradeOrReturnList(objects)) as Array<
    CourierObject<INotificationJsonWire>
  >;

  return {
    lastEvaluatedKey,
    objects: upgraded,
  };
};
export const replace = notificationService.replace;

export const merge: IReplaceFn<
  NotificationJson,
  {
    json: NotificationJson;
    title: string;
    updated?: number;
  }
> = async (params, mergeJson) => {
  const notification = await notificationService.get(params);

  const notificationWire = (await upgradeOrReturn(
    notification
  )) as CourierObject<INotificationJsonWire>;

  const newNotification = deepExtend(notificationWire, mergeJson);
  return notificationService.replace(params, newNotification);
};

export const copyLocales: (params: ICopyLocalesParams) => Promise<void> =
  async ({
    destinationDraftId,
    destinationEnv,
    destinationExists,
    notificationId,
    tenantId,
  }) => {
    const sourceNotification = await notificationService.get({
      id: notificationId,
      tenantId,
    });

    // get locales for the latest draft OR published source notification
    const locales = await getLocales({
      id: sourceNotification.json.draftId ?? notificationId,
      tenantId,
    });

    if (!Object.keys(locales).length) {
      // no locales available at source to be copied over
      return;
    }

    let destinationTenantId = "";
    const base = tenantId.split("/")[0];

    destinationTenantId =
      destinationEnv === "production" ? base : `${base}/${destinationEnv}`;

    if (destinationExists) {
      // this synchronizes destination locales with the source locales
      // depending on the state (draft/published) of the source
      await putLocales({
        id: destinationDraftId ?? notificationId,
        locales,
        tenantId: destinationTenantId,
      });
      return;
    }

    // newly created destination notification is published by default
    await putLocales({
      id: notificationId,
      locales,
      tenantId: destinationTenantId,
    });

    // this synchronizes destination locales
    // with the source locales if the source was in a draft state
    if (sourceNotification.json.draftId) {
      await putLocales({
        id: sourceNotification.json.draftId,
        locales,
        tenantId: destinationTenantId,
      });
    }
  };
