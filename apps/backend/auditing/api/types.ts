import { ApiRequestContext } from "~/lib/lambda-response";
import { IAuditEventApiOutput } from "../services/search";

export interface IApiAuditEventsListResponse {
  paging: {
    cursor?: string;
    more: boolean;
  };
  results: IAuditEventApiOutput[];
}

export type ListFn = (context: ApiRequestContext) => Promise<{
  body: IApiAuditEventsListResponse;
}>;

export type GetFn = (context: ApiRequestContext) => Promise<{
  body: IAuditEventApiOutput;
}>;
