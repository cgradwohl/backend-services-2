import { nanoid } from "nanoid";
import { actionService, messageService } from "~/send/service";
import { IPrepareAction } from "~/send/types";
import { Handler, IDataFixEvent } from "./types";
import { create as createLogEntry, EntryTypes } from "~/lib/dynamo/event-logs";
import logger from "~/lib/logger";

interface IEvent extends IDataFixEvent {
  users: Array<string>;
}

const handler: Handler<IEvent> = async (event, _context) => {
  const tenantId = "8da7a9c6-f82b-46e7-ab55-b52d77ee8d6b/test";
  const requestId = "1-62744687-275b14426696fb9164efce85";
  const template = "MCC1S4ZBR74Y19G4DBSXZYMSJFHT";

  const { users } = event;

  await Promise.all(
    users.map(async (user_id) => {
      try {
        const { message, filePath: messageFilePath } = await messageService(
          tenantId
        ).create({
          message: {
            apiVersion: "2021-11-01",
            requestId,
            idempotencyKey: undefined,
            message: {
              to: {
                user_id,
              },
              template,
            },
            messageId: nanoid(),
          },
        });

        // log out the derived message
        await createLogEntry(
          tenantId,
          message.messageId,
          EntryTypes.eventReceived,
          {
            body: {
              message: {
                to: {
                  user_id,
                },
                template,
              },
            },
          }
        );

        await actionService(tenantId).emit<IPrepareAction>({
          command: "prepare",
          dryRunKey: undefined,
          messageFilePath,
          messageId: message.messageId,
          requestId,
          tenantId,
        });
      } catch (error) {
        logger.error(`Failed to process user ${user_id}`, error);
      }
    })
  );
};

export default handler;
