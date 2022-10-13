import { HttpEventHandler } from "~/api/lists/types";
import handleErrorLog from "~/lib/handle-error-log";
import { ApiRequestContext } from "~/lib/lambda-response";
import { usersDeleteTokenHandler } from "./delete-token";
import { usersGetTokenHandler } from "./get-token";
import { usersGetTokensHandler } from "./get-tokens";
import { usersPatchTokenHandler } from "./patch-token";
import { usersPutTokenHandler } from "./put-token";
import { usersPutTokensHandler } from "./put-tokens";

const handlers: UsersHandlers = {
  "/users/{id}/tokens/{token}": {
    get: usersGetTokenHandler,
    put: usersPutTokenHandler,
    patch: usersPatchTokenHandler,
    delete: usersDeleteTokenHandler,
  },
  "/users/{id}/tokens": {
    put: usersPutTokensHandler,
    get: usersGetTokensHandler,
  },
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

export interface UsersHandlers {
  [path: string]: {
    get?: HttpEventHandler<any>;
    post?: HttpEventHandler<any>;
    put?: HttpEventHandler<any>;
    delete?: HttpEventHandler<any>;
    patch?: HttpEventHandler<any>;
  };
}
