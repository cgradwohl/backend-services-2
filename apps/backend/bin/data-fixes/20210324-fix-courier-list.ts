import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as dynamo from "~/lib/dynamo";
import {
  get as getProfile,
  update as updateProfile,
} from "~/lib/dynamo/profiles";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import { subscribe, unsubscribe } from "~/lib/lists";
import { ITenantAccessRight } from "~/lib/tenant-access-rights-service/types";
import { Handler, IDataFixEvent } from "./types";
const lambda = new Lambda({ apiVersion: "2015-03-31" });
const { COURIER_TENANT_ID } = process.env;

interface IEvent extends IDataFixEvent {
  exclusiveStartKey?: DocumentClient.Key;
}

const updateCourierListSubscription = async (userId, tenantId) => {
  const profile = await getProfile(COURIER_TENANT_ID, userId);

  let profileJSON;
  try {
    profileJSON = JSON.parse(profile?.json);
  } catch {
    profileJSON = {};
  }

  if (!profileJSON?.courier?.channel) {
    await updateProfile(COURIER_TENANT_ID, userId, {
      json: {
        ...profileJSON,
        courier: {
          channel: userId,
        },
        pusher: undefined,
      },
    });
  }

  console.log(`Subscribing user, ${userId} to COURIER List tenant.${tenantId}`);

  return subscribe(
    process.env.COURIER_TENANT_ID,
    userId,
    `tenant.${tenantId}`,
    userId
  );
};

const handler: Handler<IEvent> = async (event, context) => {
  const {
    Items: items,
    LastEvaluatedKey: lastEvaluatedKey,
  } = await dynamo.scan({
    ExclusiveStartKey: event.exclusiveStartKey,
    TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
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

  await Promise.all(
    items.map((item: ITenantAccessRight) =>
      updateCourierListSubscription(item.userId, item.tenantId).catch(
        (error) => {
          console.log(
            `Error subscribing user, ${item.userId}, to tenant.${
              item.tenantId
            }, ${error.toString()}`
          );
        }
      )
    )
  );
};

export default handler;
