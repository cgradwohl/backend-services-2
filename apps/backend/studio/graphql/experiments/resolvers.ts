import { IResolver } from "../types";
import putExperimentData from "~/lib/experiments/put-experiment-data";

type ExperimentsEventType = {
  experiment: string;
  variation: string;
  linkedExperiments: string[];
  featureFlag: string;
};

const saveExperimentEvaluation: IResolver<ExperimentsEventType> = async (
  _,
  args,
  context
) => {
  const { tenantId, user } = context;

  const { experiment, variation, linkedExperiments, featureFlag } = args.event;

  const timestamp = new Date().toISOString();

  if (linkedExperiments?.length) {
    await Promise.all(
      linkedExperiments.map(async (experiment) => {
        await putExperimentData(
          experiment,
          featureFlag,
          tenantId,
          timestamp,
          user.id,
          variation
        );
      })
    );
  } else {
    await putExperimentData(
      experiment,
      experiment,
      tenantId,
      timestamp,
      user.id,
      variation
    );
  }

  return {
    experimentKey: experiment,
    featureFlag,
    variation,
  };
};

export default {
  Mutation: {
    saveExperimentEvaluation,
  },
};
