/*
example category:-
```json
{
 "tenantId": "f46fce7f-4248-4695-8b9d-831d48423922",
 "id": "eb2c9986-c64b-461a-99ef-432628c3a1f1",
 "archived": false,
 "created": 1664319740423,
 "creator": "Google_116536091822753266253",
 "json": "{\"notificationConfig\":{\"type\":\"OPT_IN\"}}",
 "objtype": "categories",
 "title": "hello",
 "updated": 1664319740423,
 "updater": "Google_116536091822753266253"
}
```
converts this to this:-
```json
{
 "pk": "f46fce7f-4248-4695-8b9d-831d48423922",
 "sk": "templates#eb2c9986-c64b-461a-99ef-432628c3a1f1",
 "allowedPreferences": [],
 "created": "2022-09-17T05:30:54.212Z",
 "creatorId": "default",
 "defaultStatus": "OPTED_IN",
 "isArchived": false,
 "linkedNotifications": 0,
 "routingOptions": [],
 "sectionId": "5SnuRhBvvnfGYs3_vOckJ",
 "templateId": "eb2c9986-c64b-461a-99ef-432628c3a1f1",
 "templateName": "hello",
 "updated": "2022-09-17T05:30:54.212Z",
 "updaterId": "default"
}
```
*/

import { IPreferenceTemplate } from "~/preferences/types";
import { NotificationCategory } from "~/types.api";

const subscriptionStatus: Record<string, IPreferenceTemplate["defaultStatus"]> =
  {
    OPT_IN: "OPTED_IN",
    OPT_OUT: "OPTED_OUT",
    REQUIRED: "REQUIRED",
  };

export function mapCategoryToSubscriptionTopic(
  category: NotificationCategory
): IPreferenceTemplate {
  return {
    id: category.tenantId,
    templateId: category.id,
    templateName: category.title,
    creatorId: category.creator,
    updaterId: category.updater,
    created: new Date(category.created).toISOString(),
    updated: new Date(category.updated).toISOString(),
    isArchived: category.archived,
    defaultStatus: subscriptionStatus[category.json?.notificationConfig?.type],
    routingOptions: [],
    allowedPreferences: [],
    linkedNotifications: 0,
  };
}
