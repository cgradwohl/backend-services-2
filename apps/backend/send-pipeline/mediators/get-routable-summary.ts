import { SqsPrepareMessage, SqsRouteMessage } from "~/types.internal";
import getRoutableSummary from "../steps/get-routable-summary";
import getSendCandidates from "../steps/get-send-candidates";
import { IContext, PipelineStepFn } from "../types";

function assertHasArray(result: unknown): result is object[] {
  return Array.isArray(result);
}

class GetRoutableSummaryMediator {
  private fns: Map<string, PipelineStepFn>;

  public constructor() {
    this.fns = new Map<string, PipelineStepFn>();
    this.fns.set("getSendCandidates", getSendCandidates);
    this.fns.set("getRoutableSummary", getRoutableSummary);
  }

  public register(command: PipelineStepFn, name: string) {
    this.fns.set(name, command);
  }

  public async run(params: SqsPrepareMessage) {
    const getSendCandidatesHandler = this.fns.get("getSendCandidates");
    if (!getSendCandidatesHandler) {
      throw new Error("Could not find handler for getting send candidates");
    }

    const getRoutableSummaryHandler = this.fns.get("getRoutableSummary");
    if (!getRoutableSummaryHandler) {
      throw new Error("Could not find handler for getting route summary");
    }

    const sendCandidatesContext: IContext<SqsPrepareMessage> = {
      params,
    };

    const sendCandidates = await getSendCandidatesHandler(
      sendCandidatesContext
    );
    if (!sendCandidates.success || !assertHasArray(sendCandidates.result)) {
      return sendCandidates;
    }

    const routableSummaries = await Promise.all(
      sendCandidates.result.map(async (c) => {
        const context: IContext<SqsRouteMessage> = {
          params: c as SqsRouteMessage,
        };

        return getRoutableSummaryHandler(context);
      })
    );

    return routableSummaries.map(({ result }) => ({ ...(result as object) }));
  }
}

export default GetRoutableSummaryMediator;
