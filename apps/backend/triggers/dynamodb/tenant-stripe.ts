import { DynamoDBRecord } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import captureException from "~/lib/capture-exception";
import { createStreamHandlerWithFailures } from "~/lib/dynamo/create-stream-handler";
import dynamoToJson from "~/lib/dynamo/to-json";
import log, { error } from "~/lib/log";
import stripe from "~/lib/stripe";

const cognitoISP = new CognitoIdentityServiceProvider();

async function handleRecord(record: DynamoDBRecord) {
  if (record.eventName !== "INSERT") {
    return;
  }

  try {
    const tenant = dynamoToJson<any>(record.dynamodb.NewImage);

    const creator = await cognitoISP
      .adminGetUser({
        UserPoolId: process.env.USER_POOL_ID,
        Username: tenant.creator,
      })
      .promise();

    const { Value: email } = creator.UserAttributes.find(
      ({ Name }) => Name === "email"
    );

    await stripe.customers.create({
      email,
      metadata: { tenantId: tenant.tenantId },
      name: tenant.name,
    });
  } catch (err) {
    error(err);
    await captureException(err);
    throw err;
  }
}

export default createStreamHandlerWithFailures(
  handleRecord,
  process.env.TenantSequenceTable
);
