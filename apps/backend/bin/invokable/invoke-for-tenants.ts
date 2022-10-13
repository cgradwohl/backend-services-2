import { Context } from "aws-lambda";
import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import log, { warn } from "~/lib/log";
import { scan } from "~/lib/tenant-service";

/*
To Invoke:

yarn serverless invoke -f BinInvokeForTenants -p ./debug.EXAMPLE.json

Expects a file input like:

{
  "lambdaFn": "some-lambda-fn",
  "tenants": [
    "tenant-id-1",
    "tenant-id-2",
    "tenant-id-3"
  ]
}

If no tenant list is provided, the script will be run for all tenants
*/

interface IInvokeEvent {
  lambdaFn: string;
  lastEvaluatedKey?: DocumentClient.Key;
  limit?: number;
  wait?: number;
  tenants?: string[];
}

const lambda = new Lambda({ apiVersion: "2015-03-31" });

const invokeFn = async (fn: string, tenantId: string, event: any) => {
  log(`invoking ${fn} for ${tenantId}`);

  return lambda
    .invoke({
      FunctionName: fn,
      InvocationType: "Event",
      Payload: JSON.stringify({ tenantId, ...event }),
    })
    .promise();
};

export async function handle(event: IInvokeEvent, context: Context) {
  const {
    lambdaFn,
    lastEvaluatedKey,
    tenants = [],
    limit = 50,
    wait,
    ...rest
  } = event;

  if (!lambdaFn) {
    throw new Error("Must provide a lambda function to execute");
  }

  if (wait && wait > 10000) {
    throw new Error("Wait time must be at most 10s");
  }

  if (tenants.length === 0 && !lastEvaluatedKey) {
    warn(`${lambdaFn} will be run for all tenants`);
  }

  if (tenants.length) {
    for (const tenant of tenants) {
      await invokeFn(lambdaFn, tenant, rest);
    }
    return;
  }

  const scanned = await scan({
    ExclusiveStartKey: lastEvaluatedKey,
    Limit: limit,
  });

  for (const tenant of scanned.items) {
    await invokeFn(lambdaFn, tenant.tenantId, rest);
  }

  if (wait) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }

  if (scanned.lastEvaluatedKey) {
    const { functionName } = context;
    await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({
          lambdaFn,
          lastEvaluatedKey: scanned.lastEvaluatedKey,
          tenants,
          limit,
          wait,
          ...rest,
        }),
      })
      .promise();
  }
}
