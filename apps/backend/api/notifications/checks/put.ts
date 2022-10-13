import { toUuid } from "~/lib/api-key-uuid";
import * as checkService from "~/lib/check-service/index";
import { NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import logger from "~/lib/logger";
import * as notificationDraftService from "~/lib/notification-service/draft";
import * as notificationService from "~/lib/notification-service/index";
import {
  get as getLocales,
  put as putLocales,
} from "~/lib/notification-service/locales";
import { ICheck } from "~/types.api";
import { IApiNotificationPutSubmissionChecksRequest } from "~/types.public";
import { PutSubmissionChecksFn } from "../types";

const put: PutSubmissionChecksFn = async (context) => {
  const { tenantId, userId } = context;
  const id = assertPathParam(context, "id");
  const submissionId = assertPathParam(context, "submissionId");
  const body = assertBody<IApiNotificationPutSubmissionChecksRequest>(context);

  const updated = Date.now();
  const notificationId = toUuid(id);

  logger.debug(
    `Validating if submissionId [${submissionId}] for notificationId [${notificationId}]`
  );

  try {
    await checkService.get({
      id: `${notificationId}:${submissionId}`,
      tenantId,
    });
  } catch (err) {
    throw new NotFound(
      `Could not find submissionId [${submissionId}] exists for notificationId [${notificationId}]`
    );
  }

  logger.debug(
    `Updating checks for submissionId [${submissionId}] for notificationId [${notificationId}]`
  );

  await checkService.update(
    {
      id: `${notificationId}:${submissionId}`,
      tenantId,
      userId,
    },
    {
      json: body.checks.map(
        (check: Omit<ICheck, "updated" | "id" | "type">) => {
          return {
            id: "custom",
            status: check.status,
            type: "custom",
            updated,
          };
        }
      ),
    }
  );

  if (body.checks.every((check) => check.status === "RESOLVED")) {
    logger.debug(
      `All checks resolved for [${notificationId}]. Getting the latest draft in order to publish it.`
    );

    const notification = await notificationService.get({
      id: notificationId,
      tenantId,
    });

    if (notification.json.draftId) {
      logger.debug(
        `Latest draft found for [${notificationId}]. Publishing the notification.`
      );
      await notificationDraftService.publish({
        id: notification.json.draftId,
        payload: {},
        tenantId,
        userId,
      });

      const latestDraftLocales = await getLocales({
        id: notification.json.draftId,
        tenantId,
      });

      if (Object.keys(latestDraftLocales).length) {
        logger.debug(
          `Copying locales for [${notificationId}] from the latest draft [${notification.json.draftId}]`
        );
        await putLocales({
          id: notificationId,
          locales: latestDraftLocales,
          tenantId,
        });
      } else {
        logger.debug(
          `Latest draft [${notification.json.draftId}] did not have any locales to be copied over. Skip copying.`
        );
      }
    } else {
      logger.debug(
        `Publish failed for [${notificationId}] as latest draft could not be found`
      );
    }
  }

  return {
    body: {
      checks: body.checks.map((check: ICheck) => {
        return {
          id: "custom",
          status: check.status,
          type: "custom",
          updated,
        };
      }),
    },
  };
};

export default put;
