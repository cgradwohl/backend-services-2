import * as AWS from "aws-sdk";
import { queryByTenantId } from "~/lib/dynamo/tenant-auth-tokens";
import { Handler, IDataFixEvent } from "./types";

const gateway = new AWS.APIGateway();

interface IEvent extends IDataFixEvent {
  tenantIds: string[];
}

const handler: Handler<IEvent> = async (event) => {
  const usagePlans = await gateway.getUsagePlans().promise();
  const defaultUsagePlan = usagePlans.items.find(
    (plan) => plan.name === `backend-${process.env.STAGE}`
  );

  if (!defaultUsagePlan) {
    throw new Error("Could not find a Usage Plan named 'backend-STAGE'.");
  }

  for (const tenantId of event.tenantIds) {
    console.log(
      `Getting API key from auth tokens table for tenantId: ${tenantId}`
    );
    const apiKey = (await queryByTenantId(tenantId))[0].apiKey;

    if (!apiKey) {
      console.warn(`API key does not exist for tenantId ${tenantId}`);
      continue;
    }

    console.log(`Getting ID from the apiKey ${apiKey}`);

    const apiKeysResponse = await gateway
      .getApiKeys({
        limit: 1,
        nameQuery: tenantId,
      })
      .promise();

    console.log("apiKeysResponse", JSON.stringify(apiKeysResponse, null, 2));

    const id = apiKeysResponse?.items?.[0]?.id;
    if (!id) {
      console.warn(
        `Could not find ID for apiKey ${apiKey} for tenantId ${tenantId}`
      );
      continue;
    }

    console.log(`Removing ID ${id} from the gateway for tenantId: ${tenantId}`);

    await gateway
      .deleteApiKey({
        apiKey: id,
      })
      .promise();

    console.log(`Deleted api key usage plan for tenant ${tenantId}`);
  }
};

export default handler;
