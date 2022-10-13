import { BadRequest } from "~/lib/http-errors";
import trackEvent from "~/lib/tracking-service/track-event";
import getUrlParameters from "~/lib/get-url-params";
export interface IEvent {
  headers: {
    [name: string]: string;
  };
  body?: string;
  pathParameters: {
    trackingId: string;
  };
  requestPath: string;
  requestContext: {
    path: string;
    authorizer: {
      tenantId: string;
      env?: string;
    };
  };
}

export const handle = async (event: IEvent) => {
  let trackingId = event.pathParameters.trackingId;
  const {
    headers,
    requestContext: { path, authorizer },
  } = event;

  let tenantId: string, env: string;

  if (authorizer) {
    tenantId = authorizer.tenantId;
    env = authorizer.env;
  } else {
    const trackingParams = path.split("/").pop();
    const urlParams = getUrlParameters(headers.Host, trackingParams);
    tenantId = urlParams.tenantId;
    trackingId = urlParams.slug;
  }

  if (!tenantId) {
    throw new BadRequest("Missing tenantId");
  }

  await trackEvent({
    env,
    tenantId,
    trackingId,
    body: event.body,
  });

  return {
    headers: {
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Origin": "*",
    },
    statusCode: 200,
  };
};
