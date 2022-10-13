import { IRoutingSummary } from "~/send/worker/commands/route/types";

export type TemplateV1RouteNode = IRoutingSummary & {
  canUseForFailover?: boolean;
};

export type TemplateV1RoutingSummary = {
  always: TemplateV1RouteNode[];
  bestOf: TemplateV1RouteNode[];
};
