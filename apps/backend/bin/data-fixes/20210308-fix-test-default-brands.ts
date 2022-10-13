import { Lambda } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { Handler, IDataFixEvent } from "./types";

import {
  listVersions,
  getLatest,
  list,
  get as getBrand,
  create as createBrand,
  remove as removeBrand,
} from "~/lib/brands";

import {
  update as updateSettings,
  get as getSettings,
} from "~/lib/settings-service";
import { scan } from "~/lib/tenant-service";

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
        console.log("analyzing tenant: ", item.tenantId);
        const testBrands = await list(`${item.tenantId}/test`);
        if (testBrands.items.length > 1) {
          return;
        }

        const [defaultBrandId, testDefaultBrandId] = await Promise.all([
          getSettings<string>({
            id: "defaultBrandId",
            tenantId: item.tenantId,
          }),
          getSettings<string>({
            id: "defaultBrandId",
            tenantId: `${item.tenantId}/test`,
          }),
        ]);

        // my local instance has tenants without default brand ids
        if (
          defaultBrandId === testDefaultBrandId ||
          !defaultBrandId ||
          !testDefaultBrandId
        ) {
          console.log("nothing to do, skipping");
          return;
        }

        console.log("list testDefaultBrandIdVersions");
        const testDefaultBrandIdVersions = await listVersions(
          `${item.tenantId}/test`,
          testDefaultBrandId
        );

        if (testDefaultBrandIdVersions?.items?.length !== 1) {
          console.log("test default brand has > 1 version");
          return;
        }

        console.log("get latest test default brand");
        const latestBrand = await getLatest(
          `${item.tenantId}/test`,
          testDefaultBrandId
        );

        if (
          latestBrand.version !== testDefaultBrandIdVersions.items[0].version
        ) {
          console.log("latest versions don't match");
          return;
        }

        console.log("get prod default brand");
        const prodDefaultBrand = await getBrand(item.tenantId, defaultBrandId);

        console.log("creating new brand in test");
        await createBrand(
          `${item.tenantId}/test`,
          item.creator,
          prodDefaultBrand
        );

        console.log("setting new brand as default brand in test");
        await updateSettings<string>(
          {
            id: "defaultBrandId",
            tenantId: `${item.tenantId}/test`,
          },
          defaultBrandId
        );

        console.log("delete old brand");
        await removeBrand(`${item.tenantId}/test`, testDefaultBrandId);
      } catch (ex) {
        console.error(ex);
        errorTenants.push({
          tenant: item,
          ex,
        });
      }
    })
  );

  console.log("error tenants", JSON.stringify(errorTenants, null, 2));
};

export default handler;
