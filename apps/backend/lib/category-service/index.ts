import dynamoObjectService from "~/lib/dynamo/object-service";
import { IGetFn, IListFn } from "~/lib/dynamo/object-service/types";

import { INotificationCategoryJson, NotificationCategory } from "~/types.api";

const objtype = "categories";

const backCompatCategory = (category: NotificationCategory) => {
  if (category.json?.notificationConfig?.required) {
    category.json.notificationConfig.type = "REQUIRED";
  }

  if (typeof category.json?.notificationConfig?.required !== "undefined") {
    delete category.json.notificationConfig.required;
  }

  return category;
};

const service = dynamoObjectService<INotificationCategoryJson>(objtype);
export const create = service.create;
export const get: IGetFn<INotificationCategoryJson> = async (params) => {
  const category = await service.get(params);
  return backCompatCategory(category);
};
export const list: IListFn<INotificationCategoryJson> = async (params) => {
  const { objects, lastEvaluatedKey } = await service.list(params);
  return {
    objects: objects.map(backCompatCategory),
    lastEvaluatedKey,
  };
};

export const remove = service.remove;
export const replace = service.replace;
