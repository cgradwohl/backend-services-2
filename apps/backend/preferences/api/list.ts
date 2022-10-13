import { toApiKey } from "~/lib/api-key-uuid";
import * as categoryService from "~/lib/category-service";
import * as notificationService from "~/lib/notification-service";

import { ApiPreferencesListResponse } from "~/types.public";
import { IListFn } from "./types";

export const list: IListFn = async (context) => {
  const [
    { objects: categories = [] },
    { objects: notifications = [] },
  ] = await Promise.all([
    categoryService.list({ tenantId: context.tenantId }),
    notificationService.list({
      tenantId: context.tenantId,
    }),
  ]);

  const categoriesMap = categories.reduce(
    (acc, category) => ({
      ...acc,
      [category.id]: {
        config: category.json.notificationConfig,
        id: category.id,
        notifications: [],
        title: category.title,
      },
    }),
    {}
  );

  const notificationsByCategory = notifications.reduce(
    (acc, notification) => {
      const category = categoriesMap[notification.json.categoryId];

      // if notification is tied to a zombie category, it is uncategorized
      if (!category || !notification.json.categoryId) {
        acc.uncategorized.push({
          config: notification.json.config,
          id: notification.id,
          title: notification.title,
        });

        return acc;
      }

      acc.categories[category.id].notifications.push({
        config: notification.json.config,
        id: notification.id,
        title: notification.title,
      });

      return acc;
    },
    {
      categories: categoriesMap,
      uncategorized: [],
    }
  );

  const categorized = Object.values(notificationsByCategory.categories).map(
    (category: ApiPreferencesListResponse["categories"][0]) => {
      return {
        ...category,
        id: toApiKey(category.id),
        notifications: category.notifications.map((notification) => ({
          ...notification,
          id: toApiKey(notification.id),
        })),
      };
    }
  );

  return {
    categories: categorized,
    uncategorized: notificationsByCategory.uncategorized.map(
      (notification) => ({
        ...notification,
        id: toApiKey(notification.id),
      })
    ),
  };
};
