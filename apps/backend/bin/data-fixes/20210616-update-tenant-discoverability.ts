import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { scan as scanTenants } from "~/lib/tenant-service";
import { update as updateTenant } from "~/lib/tenant-service";
import { TenantDiscoverability } from "~/types.api";
import { Handler, IDataFixEvent } from "./types";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  lastEvaluatedKey?: DocumentClient.Key;
}

const handler: Handler<IEvent> = async (event, context) => {
  const errorTenants = [];
  const { items, lastEvaluatedKey } = await scanTenants({
    ExclusiveStartKey: event.lastEvaluatedKey,
    Limit: 50,
  });

  if (lastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          ...event,
          lastEvaluatedKey,
        }),
      })
      .promise();
  }

  await Promise.all(
    items.map(async (tenant) => {
      try {
        console.log("analyzing tenant", JSON.stringify(tenant, null, 2));
        const discoverable: TenantDiscoverability = !tenant.discoverable
          ? "RESTRICTED"
          : "NEEDS_ACCESS_REQUEST";
        await updateTenant({ tenantId: tenant.tenantId }, { discoverable });
      } catch (ex) {
        console.error(ex);
        errorTenants.push({
          tenant,
          ex,
        });
      }
    })
  );

  console.log("error tenants", JSON.stringify(errorTenants, null, 2));
};
export default handler;
