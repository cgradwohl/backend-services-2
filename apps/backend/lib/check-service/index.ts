import dynamoObjectService from "~/lib/dynamo/object-service";
import * as notificationService from "~/lib/notification-service";
import * as notificationDraftService from "~/lib/notification-service/draft";
import { ICheck } from "~/types.api";

const checkService = dynamoObjectService<ICheck[]>("checks");

export const create = checkService.create;

export const get = checkService.get;

export const update = checkService.replace;

export const cancelSubmission = async ({
  id,
  submissionId,
  tenantId,
  userId,
}: {
  id: string;
  submissionId: string;
  tenantId: string;
  userId: string;
}) => {
  const notification = await notificationService.get({
    id,
    tenantId,
  });

  if (notification.json.draftId) {
    const latestDraft = await notificationDraftService.get({
      id: notification.json.draftId,
      tenantId,
    });

    if (submissionId === latestDraft.json.submitted?.toString()) {
      const timestamp = new Date().getTime();

      await notificationDraftService.replace(
        { id: latestDraft.id, tenantId, userId },
        {
          ...latestDraft,
          json: {
            ...latestDraft.json,
            canceled: timestamp,
          },
        }
      );

      const checks = await get({
        id: `${id}:${submissionId}`,
        tenantId,
      });

      await update(
        {
          id: `${id}:${submissionId}`,
          tenantId,
          userId,
        },
        {
          json: checks.json.map(() => {
            return {
              id: "custom",
              status: "FAILED",
              type: "custom",
              updated: timestamp,
            };
          }),
        }
      );
    } else {
      throw new Error(
        `Could not find matching submissionId [${submissionId}] for notificationId [${id}]`
      );
    }
  } else {
    throw new Error(
      `Submission cancelation failed for [${id}] as latest draft could not be found`
    );
  }
};
