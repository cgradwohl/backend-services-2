import { getUserCount, get as getTenant, update } from "~/lib/tenant-service";
import { Handler, IDataFixEvent } from "./types";
import * as notificationService from "~/lib/notification-service";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  tenantIds: Array<string>;
}

const handler: Handler<IEvent> = async (event) => {
  console.log("inactive workspace cleanup script started");

  const { tenantId, tenantIds } = event;
  let listOfTenantIds = tenantId ? [tenantId] : tenantIds;
  let numArchived = 0;
  console.log(`processing ${listOfTenantIds.length} tenants`);

  for (let tenantId of listOfTenantIds) {
    console.log(`begin tenantId ${tenantId}`);
    const tenant = await getTenant(tenantId);

    if (!tenant) {
      console.log(`No tenant fetched for ${tenantId}`);
      continue;
    }

    // check total sends are more than 1
    if (tenant?.usageActual > 1) {
      console.log(`tenant usageActual is ${tenant.usageActual}; skipping`);
      continue;
    }

    // check created date < 60 days
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const today = new Date();
    const created = new Date(tenant.created);
    const dayDiff = Math.round(Math.abs((+today - +created) / ONE_DAY));
    if (dayDiff < 60) {
      console.log(
        `tenant created date is ${created}, less than 60 days ago; skipping`
      );
      continue;
    }

    // check if workspace has > 1 user
    const userCount = await getUserCount(tenantId);
    if (userCount > 1) {
      console.log(`user count is ${userCount}; skipping`);
      continue;
    }

    // check for 1 notification template
    const { objects } = await notificationService.list({
      tenantId,
    });
    if (objects?.length > 1) {
      console.log(`notification template count is ${objects.length}; skipping`);
      continue;
    }

    // no conditions were met, delete the workspace
    await update({ tenantId }, { archived: Date.now() });
    numArchived++;
    console.log(`tenantId ${tenantId} archived!`);
  }

  console.log(
    `inactive workspace cleanup script finished; ${numArchived} workspaces archived`
  );
};
export default handler;
