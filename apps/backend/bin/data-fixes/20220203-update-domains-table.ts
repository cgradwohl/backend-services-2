import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as CompanyEmailValidator from "company-email-validator";

import { Handler, IDataFixEvent } from "./types";

import { scan } from "~/lib/tenant-service";
import { addTenantToDomain } from "~/lib/domains";

const lambda = new Lambda({ apiVersion: "2015-03-31" });

interface IEvent extends IDataFixEvent {
  lastEvaluatedKey?: DocumentClient.Key;
}

const handler: Handler<IEvent> = async (event, context) => {
  const errorTenants = [];
  const { items, lastEvaluatedKey } = await scan({
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
    items.map(async (item) => {
      try {
        if (!item.domains?.length) {
          return;
        }

        for (const domain of item.domains) {
          const isCompanyDomain = CompanyEmailValidator.isCompanyDomain(domain);

          if (!isCompanyDomain) {
            continue;
          }

          await addTenantToDomain(domain, item.tenantId);
        }
      } catch (ex) {
        errorTenants.push(item.tenantId);
        console.error(`error updating domain for tenant: ${item.tenantId}`, ex);
      }
    })
  );

  console.log("error tenants", JSON.stringify(errorTenants, null, 2));
};

export default handler;
