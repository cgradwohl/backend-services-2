import { SqsPrepareMessage, SqsRouteMessage } from "~/types.internal";

export interface IContext<T> {
  params: T;
}

export interface IResult {
  result: string | object | object[];
  success: boolean;
}

export type PipelineStepFn = (
  context: IContext<SqsPrepareMessage | SqsRouteMessage>
) => IResult | Promise<IResult>;
