import { INotificationWire } from "~/types.api";
import * as categoryService from "~/lib/category-service";
import { Content } from "~/api/send/types";

const getCategory = async (notification: Content | INotificationWire) => {
  const content = notification as INotificationWire;
  if (!content?.json) {
    return undefined;
  }

  if (!content?.json?.categoryId) {
    return undefined;
  }
  const category = await categoryService.get({
    id: content.json.categoryId,
    tenantId: content.tenantId,
  });

  return category;
};

export default getCategory;
