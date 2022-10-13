import accountAddedUser from "./account-added-user";
import accountCreated from "./account-created";
import accountRemovedUser from "./account-removed-user";
import brandCreated from "./brand-created";
import experiment from "./experiment";
import integrationAdded from "./integration-added";
import inviteSent from "./invite-sent";
import notificationCreated from "./notification-created";
import notificationPreviewed from "./notification-previewed";
import notificationPublished from "./notification-published";
import notificationTestSent from "./notification-test-sent";
import tenantOwnershipTransferred from "./tenant-ownership-transferred";
import userSignedIn from "./user-signed-in";
import userSignedOut from "./user-signed-out";
import userSignedUp from "./user-signed-up";

import logger from "~/lib/logger";
import { IAnalyticsEvent, IAnalyticsEventResponse } from "../../types";

// shared base segment b2b saas event structure
const baseTrackEvent = {
  context: {
    groupId: null,
  },
  event: null,
  type: "track",
  userId: null,
};

// event keys are dyanmic parts of the url. event property is derived
// from that url part. for the url: .../studio/segment/signed-in,we will
// see this transformation: signed-in => Signed In
export const transformEventKey = (key: string) =>
  key
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

// default handler leveraged by event-specific handlers to produce the
// base segment track event object for b2b saas events. handlers may
// augment the   base event with additional event-specific properties.
export const defaultHandler = ({ key, tenantId, userId }) => {
  if (!key || !tenantId || !userId) {
    logger.warn(`key: ${key}, tenantId: ${tenantId}, userId: ${userId}`);
    throw new Error(
      "Missing one or more required properties: key, tenantId, userId"
    );
  }
  const obj = {
    context: { groupId: tenantId },
    event: transformEventKey(key),
    userId,
  };
  return { ...baseTrackEvent, ...obj };
};

// event-specific handlers
// spec: https://segment.com/docs/connections/spec/b2b-saas/#signed-in
const EVENT_HANDLERS: ReadonlyMap<
  string,
  (payload: IAnalyticsEvent) => IAnalyticsEventResponse
> = new Map<string, (payload: IAnalyticsEvent) => IAnalyticsEventResponse>([
  ["account-added-user", accountAddedUser],
  ["account-created", accountCreated],
  ["account-removed-user", accountRemovedUser],
  ["brand-created", brandCreated],
  ["experiment", experiment],
  ["integration-added", integrationAdded],
  ["invite-sent", inviteSent],
  ["notification-created", notificationCreated],
  ["notification-previewed", notificationPreviewed],
  ["notification-published", notificationPublished],
  ["notification-test-sent", notificationTestSent],
  ["tenant-ownership-transferred", tenantOwnershipTransferred],
  ["user-signed-in", userSignedIn],
  ["user-signed-out", userSignedOut],
  ["user-signed-up", userSignedUp],
]);

export default EVENT_HANDLERS;
