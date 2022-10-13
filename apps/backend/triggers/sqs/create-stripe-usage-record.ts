import { SQSEvent } from "aws-lambda";

import captureException from "~/lib/capture-exception";
import logger from "~/lib/logger";
import stripe from "~/lib/stripe";
import { SqsCreateStripeUsageRecord } from "~/types.internal";

async function createStripeUsageRecord(
  message: SqsCreateStripeUsageRecord
): Promise<void> {
  const {
    idempotencyKey,
    increment,
    stripeSubscriptionItemId,
    tenantId,
    timestamp,
  } = message;

  if (!stripeSubscriptionItemId) {
    // shouldnt happen do something
    logger.warn(`No customer subscription detected for tenant: ${tenantId}`);
    return;
  }

  await stripe.subscriptionItems.createUsageRecord(
    stripeSubscriptionItemId,
    {
      action: "increment",
      quantity: increment,
      timestamp: Math.floor(timestamp / 1000),
    },
    {
      idempotencyKey,
    }
  );
}

const handle = async (event: SQSEvent) => {
  await Promise.all(
    event.Records.map(async (r) => {
      try {
        const msg = (
          typeof r.body === "string" ? JSON.parse(r.body) : r.body
        ) as SqsCreateStripeUsageRecord;
        return createStripeUsageRecord(msg);
      } catch (err) {
        logger.debug(event);
        logger.error(err);
        await captureException(err);
        throw err;
      }
    })
  );
};

export { handle };
