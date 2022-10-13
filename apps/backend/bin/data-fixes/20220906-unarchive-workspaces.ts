import { update } from "~/lib/tenant-service";
import { Handler, IDataFixEvent } from "./types";
import { CourierLogger } from "~/lib/logger";
import getTableName, { TABLE_NAMES } from "~/lib/dynamo/tablenames";
import dynamoStoreService from "~/lib/dynamo/store-service";
import { ITenantDynamoObject } from "~/types.api";
import { ITenantKey } from "~/lib/tenant-service/types";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  tenantIds: Array<string>;
}

const tableName = getTableName(TABLE_NAMES.TENANTS_TABLE_NAME);
const service = dynamoStoreService<ITenantDynamoObject, ITenantKey>(tableName);

const handler: Handler<IEvent> = async (event) => {
  const { logger } = new CourierLogger("unarchive-workspaces");
  console.log("unarchive-workspaces-script started");
  // purely to test the courierlogger as previous uses in BinDataFix have not shown in CloudWatch
  logger.debug("courier logger debug");
  logger.info("courier logger info");
  logger.warn("courier logger warn");
  logger.error("courier logger error");
  logger.fatal("courier logger fatal");

  const { tenantId, tenantIds } = event;
  let listOfTenantIds = tenantId ? [tenantId] : tenantIds;
  let numProcessed = 0;
  console.log(`processing ${listOfTenantIds.length} tenants`);

  for (let tenantId of listOfTenantIds) {
    console.log(`begin tenantId ${tenantId}`);

    const tenant = await service.get({ tenantId });
    if (!tenant) {
      console.log(`tenant ${tenantId} could not be retrieved; skipping`);
      continue;
    }
    if (!tenant.archived) {
      console.log(`tenant ${tenantId} is not archived; skipping`);
      continue;
    }

    // Only process tenants that have an archival date of the window where we ran the script
    const start = new Date(2022, 8, 1).getTime(); // 9/1/22 00:00:00
    const end = new Date(2022, 8, 2, 16, 30, 0).getTime(); // 9/2/22 16:30:00
    if (
      tenant.archived &&
      !(
        new Date(tenant.archived).getTime() >= start &&
        new Date(tenant.archived).getTime() <= end
      )
    ) {
      console.log(
        `tenant was archived outside of the inactive workspace script run timeframe ${tenant.archived}`
      );
      continue;
    }

    await update({ tenantId }, { archived: null });
    numProcessed++;
    console.log(`tenantId ${tenantId} restored!`);
  }

  console.log(
    `unarchive-workspaces-script finished; ${numProcessed} workspaces restored`
  );
};
export default handler;
