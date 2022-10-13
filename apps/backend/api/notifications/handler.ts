import { MethodNotAllowed } from "~/lib/http-errors";
import { handleIdempotentApi } from "~/lib/lambda-response";
import instrumentApi from "~/lib/middleware/instrument-api";

import cancelSubmission from "./checks/cancel-submission";
import getChecks from "./checks/get";
import putChecks from "./checks/put";
import getContent from "./content/get";
import postBlockLocales from "./locales/block/post";
import postChannelLocales from "./locales/channel/post";
import putLocale from "./locales/put";
import putLocales from "./locales/put-locales";

import list from "./content/list";
import { ApiNotificationResponse } from "./types";

const handlers = {
  "/notifications": {
    GET: list,
  },
  "/notifications/{id}/content": {
    GET: getContent,
  },
  "/notifications/{id}/draft/content": {
    GET: getContent,
  },

  "/notifications/{id}/locales": {
    PUT: putLocales,
  },
  "/notifications/{id}/draft/locales": {
    PUT: putLocales,
  },

  "/notifications/{id}/locales/{localeId}": {
    PUT: putLocale,
  },
  "/notifications/{id}/draft/locales/{localeId}": {
    PUT: putLocale,
  },

  "/notifications/{id}/blocks/{blockId}/locales": {
    POST: postBlockLocales,
  },
  "/notifications/{id}/draft/blocks/{blockId}/locales": {
    POST: postBlockLocales,
  },

  "/notifications/{id}/channels/{channelId}/locales": {
    POST: postChannelLocales,
  },
  "/notifications/{id}/draft/channels/{channelId}/locales": {
    POST: postChannelLocales,
  },

  "/notifications/{id}/{submissionId}/checks": {
    DELETE: cancelSubmission,
    GET: getChecks,
    PUT: putChecks,
  },
};

export default handleIdempotentApi<ApiNotificationResponse>(
  instrumentApi<ApiNotificationResponse>(async (context) => {
    const method = context.event.httpMethod;
    const resource = context.event.resource;
    const handler = handlers?.[resource]?.[method];

    if (!handler) {
      throw new MethodNotAllowed();
    }

    return handler(context);
  })
);
