import { nanoid } from "nanoid";
import { putRecord, putRecords } from "~/lib/kinesis";
import { InvalidArgumentSendError, UnavailableSendError } from "../errors";
import { ActionService, IAction, IActionRecord } from "../types";

const ACTION_STREAM = process.env.ACTION_STREAM;

const actionService: ActionService = (tenantId: string) => {
  return {
    emit: async (action: IAction) => {
      if (!tenantId) {
        throw new InvalidArgumentSendError(
          "Missing tenantId. tenantId is required to emit an action."
        );
      }

      if (!action) {
        throw new InvalidArgumentSendError(
          "Missing action. An action is required to emit an event into the ActionStream."
        );
      }

      try {
        await putRecord<IActionRecord>({
          Data: {
            ...action,
            tenantId,
          },
          PartitionKey: nanoid(),
          StreamName: ACTION_STREAM!,
        });
      } catch (error) {
        throw new UnavailableSendError(error);
      }
    },
    emitActions: async (actions: IAction[]) => {
      await putRecords(
        actions.map((action) => ({
          Data: {
            ...action,
            tenantId,
          },
          PartitionKey: nanoid(),
        })),
        ACTION_STREAM!
      );
    },
  };
};

export default actionService;
