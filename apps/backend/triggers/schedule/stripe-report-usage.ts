/*
  Runs on the cron schedule specified in the serverless.yml file.

  Can also be invoked manually:
  yarn serverless invoke -f StripeReportUsage
*/

import { Context } from "aws-lambda";
import { Lambda } from "aws-sdk";

import captureException from "~/lib/capture-exception";
import enqueue from "~/lib/enqueue";
import { error } from "~/lib/log";
import { scan } from "~/lib/tenant-service";
import { ITenant } from "~/types.api";
import { SqsUpdateReportedUsageMessage } from "~/types.internal";

const enqueueMessage = enqueue<SqsUpdateReportedUsageMessage>(
  process.env.SQS_UPDATE_REPORTED_USAGE_QUEUE_NAME
);

const lambda = new Lambda({ apiVersion: "2015-03-31" });

async function processTenant(tenant: ITenant) {
  try {
    // intentionally resilient such that one tenant will not abort the process
    const {
      stripeCustomerId,
      stripeSubscriptionItemId,
      stripeSubscriptionStatus,
      tenantId,
      usageActual,
      usageReported,
    } = tenant;

    if (!Boolean(usageActual)) {
      return;
    }

    if (usageActual === usageReported) {
      return;
    }

    await enqueueMessage({
      stripeCustomerId,
      stripeSubscriptionItemId,
      stripeSubscriptionStatus,
      tenantId,
      usageActual,
      usageReported,
    });
  } catch (err) {
    error(err);
    captureException(err);
  }
}

export async function handle(event: any, context: Context) {
  try {
    const { lastEvaluatedKey } = event;

    const tenants = await scan({
      ExclusiveStartKey: lastEvaluatedKey,
      ExpressionAttributeValues: {
        ":active": "active",
      },
      FilterExpression:
        "attribute_exists(stripeCustomerId) and stripeSubscriptionStatus = :active",
      Limit: 100,
    });

    await Promise.all(tenants.items.map(processTenant));

    if (tenants.lastEvaluatedKey) {
      const { functionName } = context;
      await lambda
        .invoke({
          FunctionName: functionName,
          InvocationType: "Event",
          Payload: JSON.stringify({
            lastEvaluatedKey: tenants.lastEvaluatedKey,
          }),
        })
        .promise();
    }
  } catch (err) {
    error(err);
    captureException(err);
    throw err;
  }
}
