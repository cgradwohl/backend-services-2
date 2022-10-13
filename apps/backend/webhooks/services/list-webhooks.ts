import dynamoObjectService from "~/lib/dynamo/object-service";
import { InternalCourierError } from "~/lib/errors";
import logger from "~/lib/logger";
import { IWebhookJson } from "../types";

export const listWebhooks = async (tenantId: string) => {
  const webhookService = dynamoObjectService<IWebhookJson>("webhook");

  try {
    const { objects: webhooks } = await webhookService.list({
      ExpressionAttributeValues: {
        ":webhook": "settings/webhook",
      },
      FilterExpression: "begins_with(id, :webhook)",
      tenantId,
    });

    return webhooks;
  } catch (error) {
    logger.error("::: List Webhooks Error :::", error);
    throw new InternalCourierError(error);
  }
};
