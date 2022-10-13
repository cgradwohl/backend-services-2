import { updateUser } from "~/lib/cognito";
import { subscribeInApp } from "~/lib/courier-in-app";
import { put } from "~/lib/dynamo";
import { Forbidden } from "~/lib/http-errors";
import { verify } from "~/lib/invitation-service/invite-user-code";
import * as invitationObject from "~/lib/invitation-service/invite-user-object";
import { get as getTenant } from "~/lib/tenant-service";

import getCourierClient from "~/lib/courier";
import { sendTrackEvent } from "~/lib/segment";
import { IUserSsoProvider } from "~/types.api";
import { isCustomSsoUser, isGoogleSsoUser } from "../cognito/sso";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import { CourierLogger } from "../logger";

const courier = getCourierClient();
const { logger } = new CourierLogger("Add User Error");

// feature that allows users to be added to existing tenants via
// emailed invitation code feature
// or free-to-join tenants with email matching the approved domain
const addUser = async ({
  userId,
  email,
  tenantId,
  invitationCode,
  role,
}: {
  userId: string;
  email: string;
  tenantId: string;
  invitationCode?: string;
  role?: string;
}) => {
  let invitationRole;
  // ensure invitation is legit and derive the role
  if (invitationCode) {
    const { data } = await verify(invitationCode);
    invitationRole = data.role ?? "ADMINISTRATOR";

    try {
      // cancel invite reminder automation
      await courier.automations.invokeAdHocAutomation({
        automation: {
          steps: [
            {
              action: "cancel",
              cancelation_token: invitationCode,
            },
          ],
        },
      });
    } catch (e) {
      logger.error(e);
    }
  }

  // ensure tenant existence
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw new Error("No Tenant Found.");
  }

  const { discoverable, domains = [], requireSso } = tenant;

  if (requireSso) {
    validateSsoRequirements(requireSso, userId);
  }

  // non-invitation use-case
  if (!invitationCode) {
    if (discoverable !== "FREE_TO_JOIN") {
      // has be configured to be joinable without having to request access
      throw new Forbidden(
        "This tenant is not configured to join without an invitation or an approval"
      );
    } else if (!domains.some((domain) => email.endsWith(`@${domain}`))) {
      // has to match domain requirements
      throw new Forbidden(
        `This tenant requires users to be in one of the domains: ${domains.join()}`
      );
    }
  }

  await put({
    Item: {
      created: new Date().getTime(),
      creator: userId,
      role: role ?? invitationRole ?? "ADMINISTRATOR",
      tenantId,
      userId,
    },
    TableName: getTableName(TABLE_NAMES.TENANT_ACCESS_RIGHTS_TABLE_NAME),
  });

  if (invitationCode) {
    // clean up invitation records now that user is correctly associated
    // with their invited tenant
    await invitationObject.remove({ tenantId, code: invitationCode, email });
  }

  await subscribeInApp(userId, tenantId);
  // auto-verify email address since code was sent via email
  await updateUser(userId, {
    email_verified: true,
  });

  await courier.send({
    message: {
      to: {
        list_id: `tenant.${tenantId}`,
      },
      template: "NEW_USER_JOINED_WORKSPACE",
      data: {
        newMemberName: "",
        newMemberEmail: email,
        newMemberUserId: userId,
        workspaceName: tenant.name ?? "your workspace",
      },
    },
  });

  await sendTrackEvent({
    body: { addedUserId: userId },
    key: "account-added-user",
    tenantId: tenant.tenantId,
    userId,
  });

  return tenant;
};

function validateSsoRequirements(
  requireSso: IUserSsoProvider | undefined,
  userId: string
) {
  if (requireSso === "google" && !isGoogleSsoUser(userId)) {
    throw new Forbidden(
      `This tenant requires registration using Google Single Sign-On (SSO)`
    );
  }

  if (requireSso.startsWith("custom:") && !isCustomSsoUser(userId)) {
    throw new Forbidden(
      `This tenant requires registration using a Single Sign-On (SSO) provider`
    );
  }
}

export default addUser;
