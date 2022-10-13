import decodeId from "~/studio/graphql/lib/decode-id";
import toConnection from "~/studio/graphql/lib/to-connection";
import { IResolver } from "~/studio/graphql/types";
import { UnpackPromise } from "~/lib/types/unpack-promise";
import RunsDataSource from "../runs/data-sources/runs";
import toElasticSearchConnection from "~/studio/graphql/lib/to-elastic-search-connection";
import { InvalidStepDefinitionError } from "~/automations/lib/errors";
import logger from "~/lib/logger";

type Step = UnpackPromise<ReturnType<RunsDataSource["get"]>>;

const objtype = "run";

const run: IResolver = async (_, args, context) => {
  const runId = args?.runId;
  return runId ? context.dataSources.runs.get(runId) : null;
};

const runs: IResolver = async (_, args, context) => {
  const response = await context.dataSources.runs.list({
    after: args?.after,
    limit: args?.limit,
    search: args?.search,
  });

  return toElasticSearchConnection(
    response.items,
    response?.next,
    response?.prev
  );
};

const runContext: IResolver<{ runId: string }> = async (source, _, context) => {
  return context.dataSources.runs.getRunContext(source.runId);
};

const stepsForRun: IResolver<{ runId: string }> = async (
  source,
  _,
  context
) => {
  const response = await context.dataSources.runs.getStepsByRun(source.runId);

  return toConnection(response.nodes);
};

const cancelRun: IResolver = async (_, args, context) => {
  await context.dataSources.runs.cancel(args.runId);

  return args.runId;
};

const invokeRun: IResolver = async (_, args, context) => {
  const invokeRequestInput = JSON.parse(args.request);
  const runId = args.runId;
  const invokeRequest = {
    ...invokeRequestInput,
    runId,
    scope: context.scope,
  };

  try {
    await context.dataSources.runs.invoke(invokeRequest);

    return invokeRequest.runId;
  } catch (error) {
    if (error instanceof InvalidStepDefinitionError) {
      logger.warn("Invalid Step Definition", error);
      return;
    }

    throw error;
  }
};

export default {
  Query: {
    runs,
    run,
  },

  Mutation: {
    cancelRun,
    invokeRun,
  },

  Run: {
    __isTypeOf: (source: { id: string }) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
    context: runContext,
    steps: stepsForRun,
  },

  Step: {
    __isTypeOf: (source: Step) => {
      return decodeId(source?.id)?.objtype === objtype;
    },
  },
};
