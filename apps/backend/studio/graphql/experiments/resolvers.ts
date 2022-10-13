import { IResolver } from "../types";
import putExperimentData from "~/lib/experiments/put-experiment-data";

type ExperimentsEventType = {
  experiment: string;
  variation: string;
};

const saveExperimentEvaluation: IResolver<ExperimentsEventType> = async (
  _,
  args,
  context
) => {
  const { tenantId, user } = context;

  const { experiment, variation } = args.event;

  const timestamp = new Date().toISOString();

  await putExperimentData(experiment, tenantId, timestamp, user.id, variation);

  return {
    experimentKey: experiment,
    variation,
  };
};

export default {
  Mutation: {
    saveExperimentEvaluation,
  },
};
