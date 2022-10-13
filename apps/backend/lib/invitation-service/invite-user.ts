import { emitUserInvitedEvent } from "~/auditing/services/emit";
import { getUser, getUserByEmail } from "~/lib/cognito";
import getCourierClient from "~/lib/courier";
import { ITenant } from "~/types.api";
import { CourierLogger } from "../logger";
import * as verificationCode from "./invite-user-code";
import * as invitationObject from "./invite-user-object";

const courier = getCourierClient();
const { logger } = new CourierLogger("Invite user Error");

const inviteUser = async ({
  email,
  origin,
  tenant,
  role,
  userId,
  inviteSource,
  channel,
  ownerFirstName,
}: {
  email: string;
  origin: string;
  role?: string;
  tenant: ITenant;
  userId: string;
  // TODO: Investigate all the places in frontend where we can invite a user, then change inviteSource to an enum
  inviteSource?: string;
  channel?: string;
  ownerFirstName?: string;
}): Promise<string> => {
  if (!tenant) {
    throw new Error("No tenant found.");
  }

  const { tenantId, requireSso, name: companyName } = tenant;

  const { code } = await verificationCode.create(
    {
      email,
      role,
      tenantId,
      userId,
    },
    {
      additionalAttributes: {
        email,
      },
      transform: (newCode) => {
        if (requireSso) {
          return `${requireSso}/${newCode}`;
        }

        return newCode;
      },
    }
  );

  // generate invitation code
  const invitationObj = {
    creator: userId,
    json: { code, email, role },
    title: code,
  };

  // generate invitation object, which is used to show pending team
  // invitations in the studio systems page
  await invitationObject.create({ tenantId, userId }, invitationObj);

  const encodedCode = encodeURIComponent(code);
  const encodedEmail = encodeURIComponent(email);
  const companyNameEncoded = encodeURIComponent(companyName);
  const inviteLink = `${origin}/login?access_token=${encodedCode}&company_name=${companyNameEncoded}&email=${encodedEmail}`;

  if (inviteSource === "onboarding") {
    await courier.send({
      data: {
        inviteLink,
        accessToken: code,
        workspaceName: companyName,
        ownerFirstName,
        channel,
      },
      eventId: "ONBOARDING_USER_INVITE",
      profile: { email },
      recipientId: `${code}-${email}`,
    });
  } else {
    await courier.send({
      data: {
        inviteLink,
        accessToken: code,
        companyName,
        workspaceName: companyName,
      },
      eventId: "USER_INVITATION",
      profile: { email },
      recipientId: `${code}-${email}`,
    });
  }

  let userObj: { id: string; email: string };

  const recipient = email ? { email } : { email: "" };

  // we don't want invitation process to fail
  try {
    const user = await getUser(userId);
    userObj = { id: userId, email: user.email };
  } catch (err) {
    userObj = { id: userId, email: "" };
  }

  await emitUserInvitedEvent(
    "published/production",
    new Date(),
    userObj,
    tenantId,
    recipient
  );

  const dayOfTheWeek = new Date().getDate();
  let invitedUserId;
  try {
    const invitedUser = await getUserByEmail(email);
    invitedUserId = invitedUser.id;
  } catch (e) {
    // no problem if we don't find a user
    invitedUserId = "";
  }

  const variableDelay =
    dayOfTheWeek >= 5 ? (dayOfTheWeek === 5 ? "3 days" : "2 days") : "1 day";

  try {
    await courier.automations.invokeAdHocAutomation({
      automation: {
        cancelation_token: code,
        steps: [
          {
            action: "delay",
            duration: variableDelay,
          },
          {
            action: "send",
            template: "USER_INVITE_REMINDER",
            recipient: `${code}-${email}`,
            profile: {
              email,
              user_id: invitedUserId,
            },
            data: {
              workspaceName: companyName,
              // until users get saved in a user table, this will be empty
              inviterName: "",
              inviterEmail: userObj.email,
            },
          },
        ],
      },
    });
  } catch (e) {
    logger.error(e);
  }

  return code;
};
export default inviteUser;
