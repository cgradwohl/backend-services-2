import { nanoid } from "nanoid";
import getEnvVar from "~/lib/get-environment-variable";
import { putRecord } from "~/lib/kinesis";
import { IAction, IActionRecord, ISendAudiencesAction } from "~/send/types";
import { UnavailableSendError } from "../errors";

const AUDIENCE_STREAM = getEnvVar("AUDIENCE_STREAM");

export const audiencesService = (tenantId: string) => {
  return {
    emit: async <T extends IAction>(action: T) => {
      try {
        await putRecord<IActionRecord>({
          Data: {
            ...action,
            tenantId,
          },
          PartitionKey: nanoid(),
          StreamName: AUDIENCE_STREAM,
        });
      } catch (error) {
        throw new UnavailableSendError(error, {
          tenantId,
          audienceId: (action as unknown as ISendAudiencesAction)?.audienceId,
        });
      }
    },
  };
};
