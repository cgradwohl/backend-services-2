import handleErrorLog from "~/lib/handle-error-log";
import { ApiRequestContext } from "~/lib/lambda-response";
import enforceRateLimit from "~/lib/rate-limit-proxy";

import getListItems from "./get";
import deleteListItem from "./{id}/delete";
import getListItem from "./{id}/get";
import putListItem from "./{id}/put";
import restoreListItem from "./{id}/restore/put";
import getSubscriptions from "./{id}/subscriptions/get";
import postSubscriptions from "./{id}/subscriptions/post";
import putSubscriptions from "./{id}/subscriptions/put";
import unsubscribe from "./{id}/subscriptions/{id}/delete";
import getSubscription from "./{id}/subscriptions/{id}/get";
import subscribe from "./{id}/subscriptions/{id}/put";

const handlers = {
  "/lists": {
    get: getListItems,
  },
  "/lists/{id}": {
    delete: deleteListItem,
    get: getListItem,
    put: enforceRateLimit(putListItem),
  },
  "/lists/{id}/restore": {
    put: restoreListItem,
  },
  "/lists/{id}/subscriptions": {
    get: getSubscriptions,
    post: postSubscriptions,
    put: putSubscriptions,
  },
  "/lists/{id}/subscriptions/{recipientId}": {
    delete: unsubscribe,
    get: getSubscription,
    put: subscribe,
  },
};

const getHandler = (context: ApiRequestContext) => {
  const method = (context.event.httpMethod || "").toLowerCase();
  const resource = context.event.resource;

  try {
    return handlers?.[resource]?.[method];
  } catch (err) {
    handleErrorLog(err);

    throw err;
  }
};

export default getHandler;
