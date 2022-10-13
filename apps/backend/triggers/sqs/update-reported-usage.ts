import { SQSEvent } from "aws-lambda";
import { v4 } from "uuid";

import { incrementUsage as updateCalixaUsage } from "~/lib/calixa";
import captureException from "~/lib/capture-exception";
import enqueue from "~/lib/enqueue";
import logger from "~/lib/logger";
import { update as updateTenant } from "~/lib/tenant-service";
import {
  SqsCreateStripeUsageRecord,
  SqsUpdateReportedUsageMessage,
} from "~/types.internal";

const enqueueMessage = enqueue<SqsCreateStripeUsageRecord>(
  process.env.SQS_CREATE_STRIPE_USAGE_RECORD_QUEUE_NAME
);

function calculateIncrement(
  usageActual: number = 0,
  usageReported: number = 0
) {
  if (!Boolean(usageActual) || usageReported > usageActual) {
    return 0;
  }

  return usageActual - usageReported;
}

async function updateReportedUsage(
  message: SqsUpdateReportedUsageMessage
): Promise<void> {
  const {
    stripeCustomerId,
    stripeSubscriptionItemId,
    stripeSubscriptionStatus,
    tenantId,
    usageActual,
    usageReported,
  } = message;

  const increment = calculateIncrement(usageActual, usageReported);
  const timestamp = Date.now();

  if (increment === 0) {
    return;
  }

  await updateTenant({ tenantId }, { usageReported: usageActual });

  try {
    await updateCalixaUsage(tenantId, increment, timestamp);
  } catch (err) {
    // tslint:disable-next-line: no-console
    console.error("Calixa: Error creating usage record", err);
  }

  await enqueueMessage({
    idempotencyKey: v4(),
    increment,
    stripeCustomerId,
    stripeSubscriptionItemId,
    stripeSubscriptionStatus,
    tenantId,
    timestamp,
  });
}

const handle = async (event: SQSEvent) => {
  await Promise.all(
    event.Records.map(async (r) => {
      try {
        const msg = (
          typeof r.body === "string" ? JSON.parse(r.body) : r.body
        ) as SqsUpdateReportedUsageMessage;
        return updateReportedUsage(msg);
      } catch (err) {
        logger.debug(event);
        // tslint:disable-next-line: no-console
        console.error(err);
        await captureException(err);
        throw err;
      }
    })
  );
};

export { handle };
