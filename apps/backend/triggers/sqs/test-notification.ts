import { SQSEvent } from "aws-lambda";
import captureException from "~/lib/capture-exception";
import getTenantInfo from "~/lib/get-tenant-info";
import logger from "~/lib/logger";
import renderPreviewEmail from "~/lib/notifications/render-preview-email";
import { listTenantUsers } from "~/lib/tenant-service";
import send from "~/providers/test-notification-send";
import { SqsTestNotificationMessage } from "~/types.internal";

async function testNotification(
  message: SqsTestNotificationMessage
): Promise<void> {
  const { tenantId } = getTenantInfo(message.tenantId);
  const tenantUsers = await listTenantUsers({
    tenantId,
    userId: message.recipientId,
    userPoolId: message.userPoolId,
  });

  const response = await Promise.all(
    tenantUsers
      .filter(
        (tenantUser) =>
          tenantUser.verified && message.users.includes(tenantUser.id)
      )
      .map(async (user) => {
        const { params, templates } = await renderPreviewEmail({
          ...message,
          eventProfile: {
            ...message.eventProfile,
            email: user.email,
          },
        });

        return send(params, templates);
      })
  );

  logger.debug(response);
}

const handle = async (ev: SQSEvent) => {
  await Promise.all(
    ev.Records.map(async (r) => {
      try {
        const msg = (
          typeof r.body === "string" ? JSON.parse(r.body) : r.body
        ) as SqsTestNotificationMessage;
        return await testNotification(msg);
      } catch (err) {
        logger.debug(JSON.stringify(ev, null, 2));
        logger.error(err);

        await captureException(err);
        throw err;
      }
    })
  );
};

export { handle };
