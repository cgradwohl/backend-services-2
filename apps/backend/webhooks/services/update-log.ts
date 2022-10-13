import { InternalCourierError } from "~/lib/errors";
import logger from "~/lib/logger";
import { IWebhookLog } from "../types";

export const updateLog = async (
  service: {
    update(log: IWebhookLog, discriminator: string): Promise<IWebhookLog>;
  },
  log: IWebhookLog,
  eventId: string
): Promise<void> => {
  try {
    await service.update(log, eventId);
  } catch (error) {
    logger.error("::: Update Webhook Log Error :::", error);
    throw new InternalCourierError(error);
  }
};
