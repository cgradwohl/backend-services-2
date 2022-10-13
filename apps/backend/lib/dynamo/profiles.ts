// tslint:disable-next-line: no-var-requires
const jsonMerger = require("json-merger");
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import uuidPackage from "uuid-apikey";
import { deleteItem, getItem, update as updateItem } from "./index";

import fromCourierObjectList from "~/lib/lists/from-courier-object";
import { listItemStore, subscriptionStore } from "~/lib/lists/stores";

import { CourierObject, IProfile } from "~/types.api";

import { MessageRecipient, Recipient, UserRecipient } from "~/api/send/types";
import { IProfilePreferences } from "../../types.public";
import { IDynamoListItemJson, IListItem } from "../lists/types";
import getTableName, { TABLE_NAMES } from "./tablenames";

export interface IProfileObject {
  tenantId: string;
  id: string;
  json?: any;
  preferences?: IProfilePreferences;
  updated: number;
}

export interface IRecipientObject {
  tenantId: string;
}

interface IGetListsFn {
  items: IListItem[];
  lastEvaluatedKey: DocumentClient.Key;
}

export const getNotificationId = (id: string) => {
  if (uuidPackage.isAPIKey(id)) {
    return id;
  }

  try {
    return uuidPackage.toAPIKey(id, { noDashes: true });
  } catch (error) {
    // swallow invalid uuid error
    return undefined;
  }
};

const upgradePreferences = (preferences) => {
  if (!preferences) {
    return undefined;
  }

  return Object.keys(preferences).reduce((acc, id) => {
    // TODO figure out why we have undefined and fix the data
    if (id === "undefined") {
      return { ...acc };
    }

    const pref = preferences[id];
    const notificationId = getNotificationId(id);

    if (!notificationId) {
      return { ...acc };
    }

    if (typeof pref.disabled !== "undefined") {
      const status = pref.disabled ? "OPTED_OUT" : undefined;
      delete pref.disabled;

      return {
        ...acc,
        [notificationId]: {
          ...pref,
          status,
        },
      };
    }

    return {
      ...acc,
      [notificationId]: pref,
    };
  }, {});
};

export const get = async (
  tenantId: string,
  profileId: string
): Promise<IProfileObject | null> => {
  const profileRes = await getItem({
    Key: {
      id: profileId,
      tenantId,
    },
    TableName: getTableName(TABLE_NAMES.PROFILES_TABLE_NAME),
  });

  if (!profileRes?.Item) {
    return null;
  }

  const profile = profileRes.Item as unknown as IProfileObject;
  const { categories, notifications } = profile?.preferences ?? {};

  if (profile?.preferences) {
    profile.preferences = {
      // backwards compat
      ...profile.preferences,
      categories: upgradePreferences(categories),
      notifications: upgradePreferences(notifications),
    };
  }

  return profile;
};

const mergeProfiles = (
  recipientProfile: IProfileObject,
  eventProfile: UserRecipient
) => {
  return jsonMerger.mergeObjects([
    recipientProfile ?? {},
    eventProfile ?? {},
  ]) as IProfileObject;
};

const getRecipientProfile = (recipientProfile: IProfileObject) =>
  recipientProfile && recipientProfile.json
    ? typeof recipientProfile.json === "string"
      ? JSON.parse(recipientProfile.json)
      : recipientProfile.json
    : {};

export const fetchAndMergeProfile = async ({
  tenantId,
  toProfile,
}: {
  tenantId: string;
  toProfile: MessageRecipient;
}): Promise<{ mergedProfile: IProfile; savedProfile: IProfileObject }> => {
  const userId = ("user_id" in toProfile && toProfile.user_id) || "";

  if (!userId) {
    return {
      mergedProfile: toProfile,
      savedProfile: undefined,
    };
  }

  const savedProfile = userId && (await get(tenantId, userId));
  const mergedProfile = mergeProfiles(
    getRecipientProfile(savedProfile),
    toProfile as UserRecipient
  );

  return { mergedProfile, savedProfile };
};

export const getListsForProfile = async (
  tenantId: string,
  profileId: string,
  exclusiveStartKey: DocumentClient.Key,
  searchByListId = ""
): Promise<IGetListsFn> => {
  const limit = 25;
  const listIds = new Set<string>();
  const subscriptionPointers = new Set<string>();
  let currentKey = exclusiveStartKey;
  let returnKey: DocumentClient.Key;

  do {
    const { lastEvaluatedKey, objects: currentObjects } =
      await subscriptionStore.list({
        ExpressionAttributeValues: {
          ":listIdScope": `list/`,
          ":profileId": profileId,
          ":searchByListId": searchByListId,
        },
        FilterExpression:
          "begins_with(id, :listIdScope) AND contains(id, :profileId) AND contains(id, :searchByListId)",
        Limit: limit,
        exclusiveStartKey: currentKey,
        tenantId,
      });

    // using a Set ensure duplicate lists are not added while iterating over
    // lists of potentially orphaned subscriptions
    for (const subscription of currentObjects) {
      const [, listId, , pointer] = subscription.id.split("/");
      listIds.add(listId);
      subscriptionPointers.add(pointer);
    }

    if (listIds.size > limit) {
      returnKey = {
        id: [...listIds][limit - 1],
        objtype: "list",
        tenantId,
      };
    }

    if (listIds.size === limit) {
      returnKey = lastEvaluatedKey;
    }

    currentKey = lastEvaluatedKey;
  } while (listIds.size <= limit && currentKey !== undefined);

  // do not need to worry about duplicate lists b/c of the Set usage above
  const subscribedListIds = [...listIds];
  if (listIds.size > limit) {
    subscribedListIds.splice(limit);
  }

  const results = subscribedListIds.length
    ? await listItemStore.batchGet({
        configurationIds: subscribedListIds.map((listId) =>
          decodeURIComponent(listId)
        ),
        tenantId,
      })
    : [];

  const pointers = [...subscriptionPointers];
  const latestResults = results.filter(
    ({
      subscriptionPointer,
    }: CourierObject<IDynamoListItemJson> & { subscriptionPointer: string }) =>
      pointers.includes(subscriptionPointer)
  );

  return {
    items: latestResults.map(fromCourierObjectList),
    lastEvaluatedKey: returnKey,
  };
};

export const update = async (
  tenantId: string,
  profileId: string,
  updates: {
    json?: any;
    preferences?: IProfilePreferences;
  }
): Promise<void> => {
  // use an update expression to dynamically generate the values to be changed
  // based on the payload provided. The key format is key=:value
  // updated at is automatically enforced
  const updateExpression = Object.keys(updates)
    .reduce((acc, key) => [...acc, `${key}=:${key}`], ["updated=:updated"])
    .join(", ");

  // values to be used by the update expression `{ [:key]: value }`
  const expressionValueAttributes = Object.keys(updates).reduce(
    (acc, key) => ({ ...acc, [`:${key}`]: updates[key] }),
    { ":updated": new Date().getTime() }
  );

  await updateItem({
    ExpressionAttributeValues: expressionValueAttributes,
    Key: {
      id: profileId,
      tenantId,
    },
    TableName: getTableName(TABLE_NAMES.PROFILES_TABLE_NAME),
    UpdateExpression: `SET ${updateExpression}`,
  });
};

export const deleteProfile = async (
  tenantId: string,
  profileId: string
): Promise<void> => {
  await deleteItem({
    Key: {
      id: profileId,
      tenantId,
    },
    TableName: getTableName(TABLE_NAMES.PROFILES_TABLE_NAME),
  });
};
