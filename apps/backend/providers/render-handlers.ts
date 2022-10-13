import { IProviderWithTemplatesBaseRoutable } from "./types";

import africasTalkingSms from "./africastalking-sms/route-handler";
import airship from "./airship/route-handler";
import amply from "./amply/route-handler";
import apn from "./apn/route-handler";
import awsSes from "./aws-ses/route-handler";
import awsSns from "./aws-sns/route-handler";
import beamer from "./beamer/route-handler";
import chatApi from "./chat-api/route-handler";
import courier from "./courier/route-handler";
import custom from "./custom/route-handler";
import discord from "./discord/route-handler";
import drift from "./drift/route-handler";
import expo from "./expo/route-handler";
import facebookMessenger from "./facebook-messenger/route-handler";
import firebaseFCM from "./firebase-fcm/route-handler";
import gmail from "./gmail/route-handler";
import intercom from "./intercom/route-handler";
import magicbell from "./magicbell/route-handler";
import mailersend from "./mailersend/route-handler";
import mailgun from "./mailgun/route-handler";
import mailjet from "./mailjet/route-handler";
import mandrill from "./mandrill/route-handler";
import messageBirdSms from "./messagebird-sms/route-handler";
import messagemedia from "./messagemedia/route-handler";
import msteams from "./msteams/route-handler";
import nexmo from "./nexmo/route-handler";
import nowpush from "./nowpush/route-handler";
import onesignalEmail from "./onesignal-email/route-handler";
import onesignal from "./onesignal/route-handler";
import opsgenie from "./opsgenie/route-handler";
import pagerduty from "./pagerduty/route-handler";
import plivo from "./plivo/route-handler";
import postmark from "./postmark/route-handler";
import pushbullet from "./pushbullet/route-handler";
import pusherBeams from "./pusher-beams/route-handler";
import pusher from "./pusher/route-handler";
import sendgrid from "./sendgrid/route-handler";
import sinch from "./sinch/route-handler";
import slack from "./slack/route-handler";
import smtp from "./smtp/route-handler";
import sparkpost from "./sparkpost/route-handler";
import splunkOnCall from "./splunk-on-call/route-handler";
import streamChat from "./stream-chat/route-handler";
import telnyx from "./telnyx/route-handler";
import twilioWhatsapp from "./twilio-whatsapp/route-handler";
import textus from "./textus/route-handler";
import twilio from "./twilio/route-handler";
import viber from "./viber/route-handler";
import vonage from "./vonage/route-handler";
import webhook from "./webhook/route-handler";

const providers: {
  [key: string]: IProviderWithTemplatesBaseRoutable["getTemplates"] | undefined;
} = {
  "africastalking-sms": africasTalkingSms.getTemplates,
  airship: airship.getTemplates,
  amply: amply.getTemplates,
  apn: apn.getTemplates,
  "aws-ses": awsSes.getTemplates,
  "aws-sns": awsSns.getTemplates,
  beamer: beamer.getTemplates,
  "chat-api": chatApi.getTemplates,
  courier: courier.getTemplates,
  custom: custom.getTemplates,
  discord: discord.getTemplates,
  drift: drift.getTemplates,
  expo: expo.getTemplates,
  "facebook-messenger": facebookMessenger.getTemplates,
  "firebase-fcm": firebaseFCM.getTemplates,
  gmail: gmail.getTemplates,
  intercom: intercom.getTemplates,
  magicbell: magicbell.getTemplates,
  mailersend: mailersend.getTemplates,
  mailgun: mailgun.getTemplates,
  mailjet: mailjet.getTemplates,
  mandrill: mandrill.getTemplates,
  "messagebird-sms": messageBirdSms.getTemplates,
  messagemedia: messagemedia.getTemplates,
  msteams: msteams.getTemplates,
  nexmo: nexmo.getTemplates,
  nowpush: nowpush.getTemplates,
  onesignal: onesignal.getTemplates,
  "onesignal-email": onesignalEmail.getTemplates,
  opsgenie: opsgenie.getTemplates,
  pagerduty: pagerduty.getTemplates,
  plivo: plivo.getTemplates,
  postmark: postmark.getTemplates,
  pushbullet: pushbullet.getTemplates,
  pusher: pusher.getTemplates,
  "pusher-beams": pusherBeams.getTemplates,
  sendgrid: sendgrid.getTemplates,
  sinch: sinch.getTemplates,
  slack: slack.getTemplates,
  smtp: smtp.getTemplates,
  sparkpost: sparkpost.getTemplates,
  "splunk-on-call": splunkOnCall.getTemplates,
  "stream-chat": streamChat.getTemplates,
  telnyx: telnyx.getTemplates,
  textus: textus.getTemplates,
  twilio: twilio.getTemplates,
  "twilio-whatsapp": twilioWhatsapp.getTemplates,
  viber: viber.getTemplates,
  vonage: vonage.getTemplates,
  webhook: webhook.getTemplates,
};

export default providers;
