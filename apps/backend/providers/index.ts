import africasTalkingSms from "./africastalking-sms";
import airship from "./airship";
import amply from "./amply";
import apn from "./apn";
import awsSes from "./aws-ses";
import awsSns from "./aws-sns";
import beamer from "./beamer";
import chatApi from "./chat-api";
import courier from "./courier";
import custom from "./custom";
import discord from "./discord";
import drift from "./drift";
import expo from "./expo";
import facebookMessenger from "./facebook-messenger";
import firebaseFCM from "./firebase-fcm";
import gmail from "./gmail";
import intercom from "./intercom";
import magicbell from "./magicbell";
import mailersend from "./mailersend";
import mailgun from "./mailgun";
import mailjet from "./mailjet";
import mandrill from "./mandrill";
import messageBirdSms from "./messagebird-sms";
import messagemedia from "./messagemedia";
import msteams from "./msteams";
import nexmo from "./nexmo";
import nowpush from "./nowpush";
import onesignal from "./onesignal";
import onesignalEmail from "./onesignal-email";
import opsgenie from "./opsgenie";
import pagerduty from "./pagerduty";
import plivo from "./plivo";
import postmark from "./postmark";
import pushbullet from "./pushbullet";
import pusher from "./pusher";
import pusherBeams from "./pusher-beams";
import sendgrid from "./sendgrid";
import sinch from "./sinch";
import slack from "./slack";
import smtp from "./smtp";
import sparkpost from "./sparkpost";
import splunkOnCall from "./splunk-on-call";
import streamChat from "./stream-chat";
import telnyx from "./telnyx";
import textus from "./textus";
import twilio from "./twilio";
import twilioWhatsapp from "./twilio-whatsapp";
import { IProvider, IProviderWithTemplatesBase } from "./types";
import viber from "./viber";
import vonage from "./vonage";
import webhook from "./webhook";

const providers: {
  [key: string]: IProvider | IProviderWithTemplatesBase | undefined;
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
