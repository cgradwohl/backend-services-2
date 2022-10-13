import { getUserCount, get as getTenant, update } from "~/lib/tenant-service";
import { Handler, IDataFixEvent } from "./types";
import * as notificationService from "~/lib/notification-service";
import { CourierLogger } from "~/lib/logger";
import { list as listMessages } from "~/lib/dynamo/messages";
import { search as searchMessages } from "~/lib/elastic-search/messages";
import { getFeatureTenantVariation } from "~/lib/get-launch-darkly-flag";

interface IEvent extends IDataFixEvent {
  tenantId: string;
  tenantIds: Array<string>;
}

const handler: Handler<IEvent> = async (event) => {
  const { logger } = new CourierLogger("unarchive-workspaces");
  const { tenantId, tenantIds } = event;
  const INACTIVE_DAYS = 90;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const TODAY = new Date();

  logger.warn("inactive workspace cleanup v2 script started");

  let listOfTenantIds = tenantId ? [tenantId] : tenantIds;
  let numArchived = 0;
  let usageHigher = 0;
  let moreNotificationTemplates = 0;
  let createdSooner = 0;
  let recentSendSooner = 0;
  let moreErrors = 0;
  let moreUsers = 0;
  logger.warn(`processing ${listOfTenantIds.length} tenants`);

  for (let tenantId of listOfTenantIds) {
    logger.warn(`begin tenantId ${tenantId}`);
    const tenant = await getTenant(tenantId);

    if (!tenant) {
      logger.warn(`No tenant fetched for ${tenantId}`);
      continue;
    }

    // check total sends are more than 1
    if (tenant?.usageActual > 1) {
      logger.warn(`tenant usageActual is ${tenant.usageActual}; skipping`);
      usageHigher++;
      continue;
    }

    // check created date < INACTIVE_DAYS
    const created = new Date(tenant.created);
    const dayDiff = Math.round(Math.abs((+TODAY - +created) / ONE_DAY));
    if (dayDiff < INACTIVE_DAYS) {
      logger.warn(
        `tenant created date is ${created}, less than ${INACTIVE_DAYS} days ago; skipping`
      );
      createdSooner++;
      continue;
    }

    // check for recent send < INACTIVE_DAYS
    const successfulSend = await searchMessages({
      limit: 1,
      tenantId,
      statuses: ["SENT", "DELIVERED", "CLICKED", "OPENED"],
    });
    const lastSendDate = new Date(successfulSend?.messages[0]?.enqueued);
    const lastSendDays = Math.round(
      Math.abs((+TODAY - +lastSendDate) / ONE_DAY)
    );
    if (successfulSend?.messages[0] && lastSendDays < INACTIVE_DAYS) {
      logger.warn(`last notification sent ${lastSendDays} days ago; skipping`);
      recentSendSooner++;
      continue;
    }

    // check for errors > 1
    const failedSend = await searchMessages({
      limit: 2,
      tenantId,
      hasError: true,
    });
    if (failedSend?.total > 1) {
      logger.warn(`Message errors are more than 1; skipping`);
      moreErrors++;
      continue;
    }

    // check if workspace has > 1 user
    const userCount = await getUserCount(tenantId);
    if (userCount > 1) {
      logger.warn(`user count is ${userCount}; skipping`);
      moreUsers++;
      continue;
    }

    // check for 1 notification template
    const { objects } = await notificationService.list({
      tenantId,
      Limit: 3,
    });
    const templates = objects.filter(
      (obj) =>
        obj.id !== "courier-quickstart" &&
        obj.id !== "personalized-welcome-email" &&
        obj.title !== "Welcome to Courier"
    );
    if (templates?.length > 0) {
      logger.warn(`notification template count is ${objects.length}; skipping`);
      moreNotificationTemplates++;
      continue;
    }

    // no conditions were met, delete the workspace
    await update({ tenantId }, { archived: Date.now() });
    numArchived++;
    logger.warn(`tenantId ${tenantId} archived!`);
  }

  logger.warn(
    `inactive workspace cleanup script finished; ${numArchived} workspace(s) archived`
  );
  logger.warn(
    `Skipped workspaces: ${usageHigher} due to higher usageActual; ${moreNotificationTemplates} due to a real notification template; ${createdSooner} due to creation date < ${INACTIVE_DAYS} days; ${recentSendSooner} due to a recent send < ${INACTIVE_DAYS} days; ${moreErrors} due to more than 1 error; ${moreUsers} due to more than 1 user`
  );
};
export default handler;
