import { nanoid } from "nanoid";
import { putRecord } from "~/lib/kinesis";
import logger from "~/lib/logger";
import { IActionRecord, IAction } from "~/send/types";
import { Handler, IDataFixEvent } from "./types";

interface IEvent extends IDataFixEvent {
  actions: Array<IAction>;
}

const putActionStream = async (tenantId: string, action: IAction) => {
  await putRecord<IActionRecord>({
    Data: {
      ...action,
      tenantId,
    },
    PartitionKey: nanoid(),
    StreamName: process.env.ACTION_STREAM,
  });
};

const handler: Handler<IEvent> = async (event) => {
  try {
    await Promise.all(
      event.actions.map(
        async ({
          command,
          dryRunKey,
          requestId,
          shouldVerifyRequestTranslation,
          tenantId,
          translated,
          ...restAction
        }) => {
          const action: IAction = {
            command,
            shouldVerifyRequestTranslation:
              shouldVerifyRequestTranslation ?? false,
            translated: translated ?? false,
            dryRunKey: dryRunKey ?? "default",
            requestId,
            tenantId,
            ...restAction,
          };

          await putActionStream(tenantId, action);
        }
      )
    );
  } catch (error) {
    logger.error(`Failed to process the command.`);
    logger.error(error);
  }
};

export default handler;
