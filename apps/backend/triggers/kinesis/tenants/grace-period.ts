import { DynamoDBRecord } from "aws-lambda";
import captureException from "~/lib/capture-exception";
import courierClient from "~/lib/courier";
import dynamoToJson from "~/lib/dynamo/to-json";
import { error } from "~/lib/log";
import { findPricingPlan } from "~/lib/plan-pricing";
import { FREE_PLAN_NOTIFICATION_CAP } from "~/studio/billing";
import { ITenantDynamoObject } from "~/types.api";
import { update as updateTenant } from "~/lib/tenant-service";
import { createEventHandlerWithFailures } from "~/lib/kinesis/create-event-handler";
import { listAccessRights } from "~/lib/tenant-access-rights-service";

export const GRACE_PERIOD_MAX_DAYS = 14;
const USAGE_GRACE_PERIOD_TEMPLATE_ALIAS = "usage-grace-period";

export async function gracePeriodDynamoHandler(data: DynamoDBRecord) {
  const newTenantImage = dynamoToJson<ITenantDynamoObject>(
    data.dynamodb.NewImage
  );
  const oldTenantImage = dynamoToJson<ITenantDynamoObject>(
    data.dynamodb.OldImage
  );

  if (newTenantImage.usageCurrentPeriod > oldTenantImage.usageCurrentPeriod) {
    const { stripeCurrentPeriodEnd, tenantId, usageCurrentPeriod, name } =
      newTenantImage;

    const pricingPlan = findPricingPlan(
      newTenantImage.stripeSubscriptionItemPriceId
    );

    // grace period shall be extended the _First Time_ a customer exceeds the send cap on the _Free_ tier
    if (
      pricingPlan === "good" &&
      usageCurrentPeriod > FREE_PLAN_NOTIFICATION_CAP &&
      !("gracePeriodStart" in newTenantImage)
    ) {
      const gracePeriodStartDate = new Date();
      const gracePeriodStart = gracePeriodStartDate.getTime();

      const twoWeeksFromNow = gracePeriodStartDate.setDate(
        gracePeriodStartDate.getDate() + GRACE_PERIOD_MAX_DAYS
      );
      const gracePeriodEnd = stripeCurrentPeriodEnd
        ? Math.min(twoWeeksFromNow, stripeCurrentPeriodEnd)
        : twoWeeksFromNow;

      await updateTenant(
        { tenantId: tenantId },
        {
          gracePeriodStart,
          gracePeriodEnd,
        }
      );
      await courierClient().automations.invokeAutomationTemplate({
        templateId: USAGE_GRACE_PERIOD_TEMPLATE_ALIAS,
        data: {
          grace_period_end_date: new Date(gracePeriodEnd).toDateString(),
          grace_period_end_days: `${GRACE_PERIOD_MAX_DAYS} days`,
          workspace_name: name,
          workspace_id: `tenant.${tenantId}`,
          cancellation_token: `${tenantId}/grace-period-automation`,
        },
      });
    } else if (
      pricingPlan === "good" &&
      usageCurrentPeriod > FREE_PLAN_NOTIFICATION_CAP * 0.8 &&
      !newTenantImage.sendLimitWarning
    ) {
      const administrators = await listAccessRights(tenantId, {
        role: "ADMINISTRATOR",
      });
      const users = administrators.map((administrator) => ({
        user_id: administrator.userId,
      }));
      await courierClient().send({
        message: {
          to: users,
          template: "FREE_TIER_USAGE_REMINDER",
          data: {
            num_monthly_sends: usageCurrentPeriod,
            workspaceName: name,
          },
        },
      });
      await updateTenant({ tenantId }, { sendLimitWarning: true });
    }
  }
}

async function handleRecord(data: DynamoDBRecord) {
  try {
    await gracePeriodDynamoHandler(data);
  } catch (err) {
    error(err);
    await captureException(err);
    throw err;
  }
}

export default createEventHandlerWithFailures<DynamoDBRecord>(
  handleRecord,
  process.env.TenantSequenceTable
);
