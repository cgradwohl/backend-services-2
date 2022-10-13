import * as profiles from "~/lib/dynamo/profiles";
import { BadRequest } from "~/lib/http-errors";
import { getPatchedDocument } from "~/lib/json-patch";
import { assertAndDecodePathParam, handleRaw } from "~/lib/lambda-response";
import trackingIdUnsubscribeHandle from "./unsubscribe-with-trackingId";

const cttDomainName = process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME || "";

// Ex: (.*)\.ct0\.app$
const tenantIdFromDomainName = new RegExp(
  `(.*)\\.${cttDomainName.split(".").join("\\.")}$`
);

type UrlParamsHandler = (
  domainName: string,
  unsubscribeParam: string
) => { tenantId: string; notificationId: string };

const BODY = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Successfully Unsubscribed from Notification</title>
    </head>
    <body>
      <p>You have been unsubscribed from this notification.</p>
    </body>
  </html>`;

// if ctt domain, get the tenantId from the subdomain
// Ex: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.ct0.app/unsubscribe/n/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/cccccccccccccccccccccccccccccccc
const getUrlParamsFromDomainName: UrlParamsHandler = (
  domainName,
  unsubscribeParam
) => {
  const match = domainName.match(tenantIdFromDomainName);
  const tenantId = (match ? match[1] : "").replace("-test", "/test");

  return {
    notificationId: unsubscribeParam,
    tenantId,
  };
};

// no ctt domain so get the tenantId from the unsubscribeParam
// Ex: /unsubscribe/n/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/cccccccccccccccccccccccccccccccc
const getUrlParamsFromPath: UrlParamsHandler = (_, unsubscribeParam) => {
  const parts = unsubscribeParam.split(".");
  const tenantId = (parts.length >= 2 ? parts[0] : "").replace(
    "-test",
    "/test"
  );

  return {
    notificationId: parts.slice(-1)[0],
    tenantId,
  };
};

// Ex: domainName = tenantId.my-website.example
// unsubscribeParam = /unsubscribe/n/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/cccccccccccccccccccccccccccccccc
const getUrlParametersFromCustomDomain: UrlParamsHandler = (
  domainName,
  unsubscribeParam
) => {
  const [fullTenantId] = domainName.split(".");
  const tenantId = fullTenantId?.replace("-test", "/test");

  return {
    notificationId: unsubscribeParam,
    tenantId,
  };
};

const getUrlParams = (domainName = "", unsubscribeParam = "") => {
  const defaultCttDomain = process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME;
  return defaultCttDomain
    ? domainName.includes(defaultCttDomain)
      ? getUrlParamsFromDomainName(domainName, unsubscribeParam)
      : getUrlParametersFromCustomDomain(domainName, unsubscribeParam)
    : getUrlParamsFromPath(domainName, unsubscribeParam);
};

export const handle = handleRaw(async (event) => {
  const {
    event: {
      path: callPath,
      pathParameters: {
        classification,
        unsubscribeParam,
        recipientId: nonDecodedRecipientId,
      },
      requestContext: { domainName },
    },
  } = event;

  if (!nonDecodedRecipientId && !callPath.includes("unsubscribe")) {
    return trackingIdUnsubscribeHandle(event);
  }

  const decodedRecipientId = assertAndDecodePathParam(event, "recipientId");

  // backporting, unsubscribe the non-decoded recipientId
  // this is ugly but necessary because the unsubscribe should unsubscribe right recipientId
  const recipientId =
    nonDecodedRecipientId === decodedRecipientId
      ? decodedRecipientId
      : nonDecodedRecipientId;

  const { notificationId, tenantId } = getUrlParams(
    domainName,
    unsubscribeParam
  );

  if (!tenantId) {
    throw new BadRequest("Missing tenantId");
  }

  if (classification !== "n") {
    throw new BadRequest("Missing or invalid classification");
  }

  if (!notificationId) {
    throw new BadRequest("Missing notificationId");
  }

  if (!recipientId) {
    throw new BadRequest("Missing recipientId");
  }

  const profile = await profiles.get(tenantId, recipientId);

  // Support only at notification level to start
  const path =
    classification === "n" ? `/notifications/${notificationId}/status` : "";

  const patchedPreferences = getPatchedDocument(
    profile && profile.preferences
      ? profile.preferences
      : {
          categories: {},
          notifications: {},
        },
    [
      {
        op: "replace",
        path,
        value: "OPTED_OUT",
      },
    ]
  );

  await profiles.update(tenantId, recipientId, {
    preferences: patchedPreferences,
  });

  return {
    body: BODY,
    headers: {
      // turn off cors
      "Access-Control-Allow-Credentials": undefined,
      "Access-Control-Allow-Origin": undefined,
      "Content-Type": "text/html",
    },
    status: 200,
    transform: (value) => value, // To prevent stringifying HTML content
  };
});
