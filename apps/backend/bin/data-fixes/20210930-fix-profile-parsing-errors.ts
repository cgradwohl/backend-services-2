import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getUser, IUser } from "~/lib/cognito";
import * as dynamodb from "~/lib/dynamo";
import { update as updateProfile } from "~/lib/dynamo/profiles";
import { IProfileObject } from "~/lib/dynamo/profiles";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { Handler, IDataFixEvent } from "./types";

const lambda = new Lambda({ apiVersion: "2015-03-31" });
interface IEvent extends IDataFixEvent {
  exclusiveStartKey?: DocumentClient.Key;
}

const updateUserProfile = async (item: IProfileObject) => {
  const { tenantId, json, id } = item;
  console.log(`Updating profile ${id} for tenant ${tenantId}.`);

  const Ids = id.split(".");

  let user: IUser;
  user = await getUser(Ids[Ids.length - 1]);

  let profileJSON;
  try {
    profileJSON = JSON.parse(json);
  } catch (err) {
    profileJSON = {};
  }
  // This second round is to make sure we cover cases (if any) with double stringify applied on them
  try {
    profileJSON = JSON.parse(profileJSON);
  } catch {}

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
    .filter((key) => isNaN(parseInt(key)))
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
    await updateProfile(item.tenantId, user.id, {
      json: JSON.stringify(fixedProfileJson),
    });
  }
};

const handler: Handler<IEvent> = async (event, context) => {
  if (process.env.KILL_PROCESS) {
    console.log("process aborted by environment varaible");
    return;
  }

  const { Items: items, LastEvaluatedKey: lastEvaluatedKey } =
    await dynamodb.query({
      ExclusiveStartKey: event.exclusiveStartKey,
      ExpressionAttributeNames: {
        "#tenantId": "tenantId",
      },
      ExpressionAttributeValues: {
        ":tenantId": process.env.COURIER_TENANT_ID,
      },
      KeyConditionExpression: "#tenantId = :tenantId",
      Limit: 1000,
      TableName: getTableName(TABLE_NAMES.PROFILES_TABLE_NAME),
    });

  for (const item of items) {
    try {
      await updateUserProfile(item as IProfileObject);
    } catch (err) {
      console.error(`Failed to process ${item.id}`, err);
    }
  }

  if (lastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          ...event,
          exclusiveStartKey: lastEvaluatedKey,
        }),
      })
      .promise();
  }
};

export default handler;
