import getCourierClient from "~/lib/courier";
import * as verificationCode from "./invite-user-code";
import * as invitationObject from "./invite-user-object";

import addTenantUser from "~/lib/tenant-service/add-user";
import { IUser } from "../cognito";

import { ITenant } from "~/types.api";
import { IVerificationCodeObject } from "~/types.internal";
import { PaymentRequired } from "../http-errors";
import { findPricingPlan } from "../plan-pricing";

const courier = getCourierClient();

export const request = async ({
  message,
  origin,
  owner,
  requester,
  tenant,
}: {
  message: string;
  origin: string;
  owner: IUser;
  requester: IUser;
  tenant: ITenant;
}): Promise<string> => {
  if (!tenant) {
    throw new Error("No tenant found.");
  }

  const { tenantId } = tenant;

  const { code } = await verificationCode.create(
    {
      email: requester.email,
      tenantId,
      userId: requester.id,
    },
    {
      transform: (newCode) => `request/${requester.id}/${newCode}`,
    }
  );

  // generate invitation code
  const invitationObj = {
    creator: requester.id,
    json: { code, email: requester.email, isRequest: true },
    title: code,
  };

  // generate invitation object, which is used to show pending team
  // invitations in the studio systems page
  await invitationObject.create(
    { tenantId, userId: requester.id },
    invitationObj
  );

  await courier.send({
    data: {
      code,
      requestEmail: requester.email,
      message,
      tenantName: tenant.name,
      origin,
    },
    eventId: "TENANT_REQUEST",
    profile: { email: owner.email },
    recipientId: owner.id,
  });

  return code;
};

export const list = async (
  userId: string
): Promise<IVerificationCodeObject[]> => {
  const codes = await verificationCode.queryBeginsWith(`request/${userId}`);

  return codes;
};

type ITenantContext = ITenant & { domains: string[]; requireSso: "Google" };

export const approve = async (
  code: string,
  tenantContext: ITenantContext
): Promise<void> => {
  const { data } = await verificationCode.get(code);
  const { stripeSubscriptionItemPriceId } = tenantContext;

  if (
    findPricingPlan(stripeSubscriptionItemPriceId) !== "custom" &&
    data.role &&
    data.role !== "ADMINISTRATOR"
  ) {
    throw new PaymentRequired(
      "Enhanced access control requires custom pricing"
    );
  }
  await addTenantUser({
    ...data,
    invitationCode: code,
  });
};
