import { HttpEventHandler } from "~/api/lists/types";
import handleErrorLog from "~/lib/handle-error-log";
import { ApiRequestContext } from "~/lib/lambda-response";
import { postIssueTokenHandler } from "./post-issue-token";

const handlers: ApiAuthHandlers = {
  "/auth/issue-token": { post: postIssueTokenHandler },
};

export const getHandler = (context: ApiRequestContext) => {
  const method = (context.event.httpMethod || "").toLowerCase();
  const resource = context.event.resource;

  try {
    return handlers[resource]?.[method];
  } catch (err) {
    handleErrorLog(err);
    throw err;
  }
};

export interface ApiAuthHandlers {
  [path: string]: {
    get?: HttpEventHandler<any>;
    post?: HttpEventHandler<any>;
    put?: HttpEventHandler<any>;
    delete?: HttpEventHandler<any>;
    patch?: HttpEventHandler<any>;
  };
}
