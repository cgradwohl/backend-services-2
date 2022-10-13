import { DynamoDBRecord } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { snakeCase } from "change-case";
import { createStreamHandlerWithFailures } from "~/lib/dynamo/create-stream-handler";

import dynamoToJson from "~/lib/dynamo/to-json";
import { warn } from "~/lib/log";
import logger from "~/lib/logger";
import { findPricingPlan } from "~/lib/plan-pricing";
import { sendGroupEvent } from "~/lib/segment";
import { get as getTenant } from "~/lib/tenant-service";

import { ITenantMetricsTraits } from "./types";

const cognitoISP = new CognitoIdentityServiceProvider();

const getUserEmail = async (owner: string) => {
  try {
    const ownerUser = await cognitoISP
      .adminGetUser({
        UserPoolId: process.env.USER_POOL_ID,
        Username: owner,
      })
      .promise();

    const { Value: email } = ownerUser.UserAttributes.find(
      ({ Name }) => Name === "email"
    );

    return email;
  } catch (e) {
    warn(e);
    return undefined;
  }
};

const formatData = async (traits: ITenantMetricsTraits) => {
  const keys = Object.keys(traits);
  const owner = traits.owner || traits.creator;

  // lookup / add convenience prop to easily identify the owner of a tenant
  const snakeCasedTraits = { owner_email: await getUserEmail(owner) };

  keys.map((key) => {
    // standardize on snake casing for properties being sent over to segment
    const snakeCasedKey = snakeCase(key).toLowerCase();

    // need to format date fields being sent over to segment
    const value =
      snakeCasedKey.endsWith("created") ||
      snakeCasedKey.endsWith("updated") ||
      snakeCasedKey.endsWith("_at") ||
      snakeCasedKey.endsWith("_start") ||
      snakeCasedKey.endsWith("_end")
        ? new Date(traits[key])
        : traits[key];

    snakeCasedTraits[snakeCasedKey] = value;
  });

  return snakeCasedTraits;
};

// record handler for INSERT and MODIFY events on the TenantMetrics table
// that shapes data sent in real-time to segment.com
async function handleStreamRecord(record: DynamoDBRecord) {
  if (record.eventName === "REMOVE") {
    return;
  }

  // we do not care about the old image for pumping metrics downstream
  // through segment + segment destinations
  const row = dynamoToJson<any>(record.dynamodb.NewImage);
  const tenantId = row.tenantId;
  const tenant = await getTenant(tenantId);

  if (!tenant) {
    logger.warn(`Tenant not found or is archived; ${tenantId}`);
    return;
  }

  const {
    brandsAccepted,
    created: createdAt,
    creator,
    discoverable,
    domains,
    name,
    notificationLastSentAt: notificationSendLastAt,
    stripeSubscriptionItemPriceId,
    owner,
    requireSso,
    usageActual: notificationSendCount = 0,
  } = tenant;

  // shape traits to be snake cased and format common date props
  const traits: ITenantMetricsTraits = {
    brandsAccepted,
    createdAt,
    creator,
    discoverable,
    domains,
    name,
    notificationSendCount,
    notificationSendLastAt,
    owner,
    planCategory: findPricingPlan(stripeSubscriptionItemPriceId),
    requireSso,
    ...row,
  };

  // snake case keys and format data as necessary for segment / destinations
  const formattedTraits = await formatData(traits);

  // send segment tenant-scoped group event
  switch (record.eventName) {
    case "INSERT":
    case "MODIFY":
      await sendGroupEvent({
        groupId: tenantId,
        traits: {
          ...formattedTraits,
          groupType: "Company",
        },
        userId: owner ?? creator,
      });
      break;
  }
}

export default createStreamHandlerWithFailures(
  handleStreamRecord,
  process.env.TENANT_SEQUENCE_TABLE
);
