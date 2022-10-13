import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as dynamo from "~/lib/dynamo";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import stripe from "~/lib/stripe";
import { update as updateTenant } from "~/lib/tenant-service";
import { ITenant } from "~/types.api";
import { Handler, IDataFixEvent } from "./types";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  exclusiveStartKey?: DocumentClient.Key;
}

const handler: Handler<IEvent> = async (event, context) => {
  const {
    Items: items,
    LastEvaluatedKey: lastEvaluatedKey,
  } = await dynamo.scan({
    ExclusiveStartKey: event.exclusiveStartKey,
    ExpressionAttributeNames: {
      "#stripeSubscriptionItemPriceId": "stripeSubscriptionItemPriceId",
    },
    FilterExpression: "attribute_not_exists(#stripeSubscriptionItemPriceId)",
    TableName: getTableName(TABLE_NAMES.TENANTS_TABLE_NAME),
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

  for (const item of items as ITenant[]) {
    const { stripeSubscriptionItemId, tenantId } = item;

    if (stripeSubscriptionItemId) {
      const subscriptionItem = await stripe.subscriptionItems.retrieve(
        stripeSubscriptionItemId
      );
      const stripeSubscriptionItemPriceId = subscriptionItem?.price?.id;
      await updateTenant({ tenantId }, { stripeSubscriptionItemPriceId });
    }
  }
};

export default handler;
