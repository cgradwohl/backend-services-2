import * as lists from "~/lib/lists";
import * as profiles from "~/lib/dynamo/profiles";
import { BadRequest, NotFound } from "~/lib/http-errors";
import { PREFERENCE_STATUS } from "~/lib/preferences";
import { getTrackingRecord } from "~/lib/tracking-service";
import { get as getMessage } from "~/lib/dynamo/messages";
import { getPatchedDocument } from "~/lib/json-patch";
import uuidPackage from "uuid-apikey";
const cttDomainName = process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME || "";

// Ex: (.*)\.ct0\.app$
const tenantIdFromDomainName = new RegExp(
  `(.*)\\.${cttDomainName.split(".").join("\\.")}$`
);

type UrlParamsHandler = (
  domainName: string,
  unsubscribeParam: string
) => { tenantId: string; trackingId: string };

const BODY = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Successfully Unsubscribed this Notification</title>
    </head>
    <body>
      <p>You have been unsubscribed from this notification.</p>
    </body>
  </html>`;

// if ctt domain, get the tenantId from the subdomain
// Ex: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.ct0.app/unsubscribe-from-collection/ccccccccccccccccccccccccccccccc
const getUrlParamsFromDomainName: UrlParamsHandler = (
  domainName,
  unsubscribeParam
) => {
  const match = domainName.match(tenantIdFromDomainName);
  const tenantId = (match ? match[1] : "").replace("-test", "/test");

  return {
    trackingId: unsubscribeParam,
    tenantId,
  };
};

// no ctt domain so get the tenantId from the unsubscribeParam
// Ex: /unsubscribe-from-collection/aaaaaaaaaaaaaaaaa.cccccccccccccccccccccccccccccccc
const getUrlParamsFromPath: UrlParamsHandler = (_, unsubscribeParam) => {
  const parts = unsubscribeParam.split(".");
  const tenantId = (parts.length >= 2 ? parts[0] : "").replace(
    "-test",
    "/test"
  );

  return {
    trackingId: parts.slice(-1)[0],
    tenantId,
  };
};

// Ex: domainName = tenantId.my-website.example
// unsubscribeParam = /unsubscribe-from-collection/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
const getUrlParametersFromCustomDomain: UrlParamsHandler = (
  domainName,
  unsubscribeParam
) => {
  const [fullTenantId] = domainName.split(".");
  const tenantId = fullTenantId?.replace("-test", "/test");

  return {
    trackingId: unsubscribeParam,
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

const trackingIdUnsubscribeHandle = async (event) => {
  const {
    event: {
      pathParameters: { unsubscribeParam },
      requestContext: { domainName },
    },
  } = event;

  const { trackingId, tenantId } = getUrlParams(domainName, unsubscribeParam);

  if (!tenantId) {
    throw new BadRequest("Missing tenantId");
  }

  if (!trackingId) {
    throw new BadRequest("Missing trackingId");
  }

  let message;

  const trackingRecord = await getTrackingRecord(tenantId, trackingId);

  if (!trackingRecord) {
    throw new NotFound();
  }

  message = await getMessage(tenantId, trackingRecord.messageId);

  const { listId, recipientId, notificationId } = message;

  const notificationApiKeyId = uuidPackage.toAPIKey(notificationId, {
    noDashes: true,
  });

  //notification sent through a list, update list subscription preferences
  if (listId) {
    const unsubscribePreferences = {
      notifications: {
        [notificationApiKeyId]: {
          status: PREFERENCE_STATUS.OPTED_OUT,
        },
      },
    };

    await lists.subscribe(
      tenantId,
      null,
      listId,
      recipientId,
      unsubscribePreferences
    );
  } else {
    //notification not sent through a list update notification level preferences
    const profile = await profiles.get(tenantId, recipientId);

    const path = `/notifications/${notificationApiKeyId}/status`;

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
  }

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
};

export default trackingIdUnsubscribeHandle;
