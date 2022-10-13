import * as dynamodb from "~/lib/dynamo";
import { update as updateProfile } from "~/lib/dynamo/profiles";
import { IProfileObject } from "~/lib/dynamo/profiles";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  ids: string[];
}

const updateUserProfile = async (item: IProfileObject) => {
  const { json, id } = item;

  let profileJSON;
  try {
    profileJSON = JSON.parse(json);
  } catch (err) {
    profileJSON = {};
  }

  // This second round is to make sure we cover cases (if any) with double stringify applied on them
  try {
    profileJSON = JSON.parse(profileJSON);
  } catch {
    // ignored
  }

  const stringDerivedFromNumbers = Object.keys(profileJSON).reduce(
    (acc, key) => {
      if (Number.isInteger(parseInt(key, 10))) {
        acc += profileJSON[key];
      }
      return acc;
    },
    ""
  );
  let objectDerivedFromNumbers;
  try {
    objectDerivedFromNumbers = JSON.parse(stringDerivedFromNumbers);
  } catch {
    objectDerivedFromNumbers = {};
  }

  const objectDerivedFromNANs = Object.keys(profileJSON)
    .filter((key) => isNaN(parseInt(key, 10)))
    .reduce(
      (validObj, validKey) => ({
        ...validObj,
        [validKey]: profileJSON[validKey],
      }),
      {}
    );

  const fixedProfileJson = {
    ...objectDerivedFromNumbers,
    ...objectDerivedFromNANs,
  };

  if (fixedProfileJson) {
    await updateProfile(item.tenantId, id, {
      json: JSON.stringify(fixedProfileJson),
    });
  }
};

const handler: Handler<IEvent> = async (event, context) => {
  if (process.env.KILL_PROCESS) {
    console.log("process aborted by environment varaible");
    return;
  }

  for (const id of event.ids) {
    const profile = (
      await dynamodb.getItem({
        Key: {
          id,
          tenantId: process.env.COURIER_TENANT_ID,
        },
        TableName: getTableName(TABLE_NAMES.PROFILES_TABLE_NAME),
      })
    ).Item as IProfileObject;

    try {
      console.log(`Updating profile ${id}`);
      await updateUserProfile(profile as IProfileObject);
      console.log(`Successfully updated profile ${profile.id}`);
    } catch (err) {
      console.error(`Failed to update profile ${profile.id}`, err);
    }
  }
};

export default handler;
