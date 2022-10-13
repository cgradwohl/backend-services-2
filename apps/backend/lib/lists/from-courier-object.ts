import { IProfilePreferences } from "~/types.public";
import { IDynamoListItem, IDynamoListItemJson, IListItem } from "./types";

type FromCourierObjectFn = (courierObject: IDynamoListItem) => IListItem;

function assertHasPreferences(
  json: IDynamoListItemJson
): json is { preferences: IProfilePreferences } {
  return "preferences" in json;
}

const fromCourierObject: FromCourierObjectFn = (courierObject) => {
  if (!courierObject) {
    return null;
  }

  const { created, creator, json, title, updated, updater } = courierObject;

  const match = courierObject.id.match(/^list\/(.*)/);
  const id = match ? match[1] : courierObject.id;

  return {
    created,
    creator,
    id,
    name: title,
    preferences: assertHasPreferences(json) ? json.preferences : undefined,
    updated: updated || created,
    updater: updater || creator,
  };
};

export default fromCourierObject;
