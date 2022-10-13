import { Context } from "aws-lambda";
import { CognitoIdentityServiceProvider, Lambda } from "aws-sdk";

import logger from "~/lib/logger";
import stripe, { Stripe } from "~/lib/stripe";
import { scan } from "~/lib/tenant-service";
import { ITenant } from "~/types.api";

/*
Invoke:
yarn serverless invoke -f BinPopulateStripe
*/

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
const lambda = new Lambda({ apiVersion: "2015-03-31" });
const userPoolId = process.env.USER_POOL_ID;

export async function handle(event: any, context: Context) {
  const { lastEvaluatedKey } = event;

  const tenants = await scan({
    ExclusiveStartKey: lastEvaluatedKey,
    Limit: 25,
  });

  async function processTenant(tenant: ITenant) {
    try {
      let customer: Stripe.Customer;

      if (tenant.stripeCustomerId) {
        customer = (await stripe.customers.retrieve(
          tenant.stripeCustomerId
        )) as Stripe.Customer;
      }

      if (!customer) {
        logger.debug(`Creating customer for tenant ${tenant.name}`);

        const { UserAttributes } = await cognitoIdentityServiceProvider
          .adminGetUser({
            UserPoolId: userPoolId,
            Username: tenant.creator,
          })
          .promise();
        const { Value } = UserAttributes.find(({ Name }) => Name === "email");

        customer = await stripe.customers.create({
          email: Value,
          metadata: { tenantId: tenant.tenantId },
          name: tenant.name,
        });
        logger.debug("customer created", customer.id);
      } else {
        logger.debug(
          `Customer exists for tenant ${tenant.name} and has ID ${customer.id}`
        );
      }
    } catch (err) {
      logger.error(err);
    }
    logger.debug(tenant);
  }

  // process tenants serially for rate limiting issues
  for (const tenant of tenants.items) {
    await processTenant(tenant);
  }

  if (tenants.lastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({ lastEvaluatedKey: tenants.lastEvaluatedKey }),
      })
      .promise();
  }
}
