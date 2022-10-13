import { nanoid } from "nanoid";
import { putRecord } from "~/lib/kinesis";
import { ISequenceAction, ISequenceRecord } from "~/send/types";
import getEnvVar from "~/lib/get-environment-variable";

const StreamName = getEnvVar("SEQUENCE_PROCESSOR_STREAM");

export const putSequenceStream = async (action: ISequenceAction) => {
  await putRecord<ISequenceRecord>({
    Data: action,
    PartitionKey: nanoid(),
    StreamName,
  });
};
