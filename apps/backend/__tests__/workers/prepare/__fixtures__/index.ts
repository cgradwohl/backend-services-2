import * as always from "./always";
import * as alwaysNoBestOf from "./always-without-best-of";
import * as channelWithoutConfiguration from "./channel-without-configuration-id";
import mailgun from "./configuration-mailgun";
import sendgrid from "./configuration-sendgrid";
import twilio from "./configuration-twilio";
import * as draftScopedNotification from "./draft-scoped-notification";
import * as filteredNotification from "./filtered-notification";
import * as legacyNotification from "./legacy-notification";
import * as noProviders from "./no-providers";
import * as noStrategy from "./no-strategy";
import * as notFoundNotification from "./not-found-notification";
import * as notification from "./notification";
import * as testNotification from "./test-notification";

const configurations = [mailgun, sendgrid, twilio];

export default {
  always,
  alwaysNoBestOf,
  channelWithoutConfiguration,
  configurations,
  draftScopedNotification,
  filteredNotification,
  legacyNotification,
  noProviders,
  noStrategy,
  notFoundNotification,
  notification,
  testNotification,
};
