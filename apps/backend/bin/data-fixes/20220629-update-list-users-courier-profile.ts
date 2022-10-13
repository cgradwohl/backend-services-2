import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
  get as getProfile,
  update as updateProfile,
} from "~/lib/dynamo/profiles";
import { getSubscriptions } from "~/lib/lists";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  listId: string;
  exclusiveStartKey?: DocumentClient.Key;
}

const lambda = new Lambda({ apiVersion: "2015-03-31" });

const handler: Handler<IEvent> = async (event, context) => {
  const { tenantId, listId, exclusiveStartKey } = event;

  const { lastEvaluatedKey, items: subscribers } = await getSubscriptions(
    tenantId,
    listId!,
    {
      exclusiveStartKey,
      limit: 500,
    }
  );

  // update user profiles
  await Promise.all(
    subscribers.map(async (subscriber) => {
      // update profile with courier block
      const userId = subscriber.recipientId;
      try {
        const profile = await getProfile(tenantId, userId);

        const json =
          typeof profile.json === "string"
            ? JSON.parse(profile.json)
            : profile.json;

        const updatedProfileJsonWithCourierChannel = {
          ...json,
          courier: {
            channel: userId,
          },
        };

        await updateProfile(tenantId, userId, {
          json: updatedProfileJsonWithCourierChannel,
        });
        console.log(`Successfully updated ${userId}`);
      } catch (err) {
        console.error(`Failed to update ${userId}`);
      }
    })
  );

  // if there are more profiles, then tail the job
  if (lastEvaluatedKey) {
    await lambda
      .invoke({
        FunctionName: context.functionName,
        InvocationType: "Event", // don't wait for response
        Payload: JSON.stringify({
          ...event,
          exclusiveStartKey: lastEvaluatedKey,
        }),
      })
      .promise();
  }
};

export default handler;
