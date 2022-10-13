import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { query } from "../../lib/dynamo";
import { getUser, IUser } from "~/lib/cognito";
import { Handler, IDataFixEvent } from "./types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Lambda } from "aws-sdk";
import { IProfileObject } from "~/lib/dynamo/profiles";
import { update as updateProfile } from "~/lib/dynamo/profiles";
import { profile } from "console";
/*
Invoke like so:

yarn serverless:invoke-local -f BinPopulateApiKeys
*/

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  exclusiveStartKey?: DocumentClient.Key;
}

const updateUserProfile = async (item: IProfileObject) => {
  console.log(`Updating profile ${item.id} for tenant ${item.tenantId}.`);

  const bothIds = item.id.split(".");

  let user: IUser;

  user = await getUser(bothIds[bothIds.length - 1]);

  let profileJSON;
  try {
    profileJSON = JSON.parse(JSON.stringify(item.json));
  } catch {
    profileJSON = {};
  }

  if (!profileJSON?.email) {
    await updateProfile(item.tenantId, user.id, {
      json: JSON.stringify({
        ...profileJSON,
        email: user.email,
      }),
    });
  }
};

const handler: Handler<IEvent> = async (event, context) => {
  const { Items: items, LastEvaluatedKey: lastEvaluatedKey } = await query({
    TableName: getTableName(TABLE_NAMES.PROFILES_TABLE_NAME),
    ExpressionAttributeNames: {
      "#tenantId": "tenantId",
    },
    ExpressionAttributeValues: {
      ":tenantId": process.env.COURIER_TENANT_ID,
    },
    KeyConditionExpression: "#tenantId = :tenantId",
    ExclusiveStartKey: event.exclusiveStartKey,
  });

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

  for (let i = 0; i < items.length; i++) {
    try {
      await updateUserProfile(items[i] as IProfileObject);
    } catch (err) {
      console.error(err);
    }
  }
};

export default handler;
