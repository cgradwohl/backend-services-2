import { DeliveryHandlerParams } from "./types";

import africasTalkingSms from "./africastalking-sms/send";
import airship from "./airship/send";
import amply from "./amply/send";
import apn from "./apn/send";
import awsSes from "./aws-ses/send";
import awsSns from "./aws-sns/send";
import beamer from "./beamer/send";
import chatApi from "./chat-api/send";
import courier, { CourierDeliveryHandlerParams } from "./courier/send";
import custom from "./custom/send";
import discord from "./discord/send";
import drift from "./drift/send";
import expo from "./expo/send";
import facebookMessenger from "./facebook-messenger/send";
import firebaseFCM from "./firebase-fcm/send";
import gmail from "./gmail/send";
import intercom from "./intercom/send";
import magicbell from "./magicbell/send";
import mailersend from "./mailersend/send";
import mailgun from "./mailgun/send";
import mailjet from "./mailjet/send";
import mandrill from "./mandrill/send";
import messageBirdSms from "./messagebird-sms/send";
import messagemedia from "./messagemedia/send";
import msteams from "./msteams/send";
import nexmo from "./nexmo/send";
import nowpush from "./nowpush/send";
import onesignalEmail from "./onesignal-email/send";
import onesignal from "./onesignal/send";
import opsgenie from "./opsgenie/send";
import pagerduty from "./pagerduty/send";
import plivo from "./plivo/send";
import postmark from "./postmark/send";
import pushbullet from "./pushbullet/send";
import pusherBeams from "./pusher-beams/send";
import pusher from "./pusher/send";
import sendgrid from "./sendgrid/send";
import sinch from "./sinch/send";
import slack from "./slack/send";
import smtp from "./smtp/send";
import sparkpost from "./sparkpost/send";
import splunkOnCall from "./splunk-on-call/send";
import streamChat from "./stream-chat/send";
import telnyx from "./telnyx/send";
import twilioWhatsapp from "./twilio-whatsapp/send";
import textus from "./textus/send";
import twilio from "./twilio/send";
import viber from "./viber/send";
import vonage from "./vonage/send";
import webhook from "./webhook/send";

const providers: {
  [key: string]: (
    params: DeliveryHandlerParams | CourierDeliveryHandlerParams,
    renderedTemplates: object
  ) => Promise<object | undefined>;
} = {
  "africastalking-sms": africasTalkingSms,
  airship,
  amply,
  apn,
  "aws-ses": awsSes,
  "aws-sns": awsSns,
  beamer,
  "chat-api": chatApi,
  courier,
  custom,
  discord,
  drift,
  expo,
  "facebook-messenger": facebookMessenger,
  "firebase-fcm": firebaseFCM,
  gmail,
  intercom,
  magicbell,
  mailersend,
  mailgun,
  mailjet,
  mandrill,
  "messagebird-sms": messageBirdSms,
  messagemedia,
  msteams,
  nexmo,
  nowpush,
  onesignal,
  "onesignal-email": onesignalEmail,
  opsgenie,
  pagerduty,
  plivo,
  postmark,
  pushbullet,
  pusher,
  "pusher-beams": pusherBeams,
  sendgrid,
  sinch,
  slack,
  smtp,
  sparkpost,
  "splunk-on-call": splunkOnCall,
  "stream-chat": streamChat,
  telnyx,
  textus,
  twilio,
  "twilio-whatsapp": twilioWhatsapp,
  viber,
  vonage,
  webhook,
};

export default providers;
