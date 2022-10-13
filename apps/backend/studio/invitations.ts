import emailValidator from "email-validator";
import KoaRouter from "koa-router";

import hasCapability from "~/lib/access-control/has-capability";
import { IRole } from "~/lib/access-control/types";
import { getUser } from "~/lib/cognito";
import { hasCourierEmail, isCourierUser } from "~/lib/courier-internal";
import { decrypt, encrypt } from "~/lib/crypto-helpers";
import { validateOrigin } from "~/lib/get-cors-origin";
import { BadRequest, PaymentRequired } from "~/lib/http-errors";
import inviteUser from "~/lib/invitation-service/invite-user";
import * as invitationObject from "~/lib/invitation-service/invite-user-object";
import * as tenantRequest from "~/lib/invitation-service/tenant-request";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import { rateLimitMiddleware } from "~/lib/middleware";
import { findPricingPlan } from "~/lib/plan-pricing";
import { sendTrackEvent } from "~/lib/segment";
import { get as getTenant } from "~/lib/tenant-service";
import requireCapabilityMiddleware from "./middleware/require-capability";

const invitations = new KoaRouter();

interface IInvitationEmail {
  email: string;
  inviteSource?: string;
  channel?: string;
  role?: IRole["key"];
  ownerFirstName?: string;
}

invitations.post(
  "/",
  requireCapabilityMiddleware("user:InviteUser"),
  rateLimitMiddleware("invites"),
  async (ctx) => {
    const {
      email,
      role = "ANALYST",
      inviteSource,
      channel,
      ownerFirstName,
    } = assertBody(ctx) as IInvitationEmail;
    const { userId } = ctx.userContext;
    const { stripeSubscriptionItemPriceId } = ctx.tenantContext;

    if (
      findPricingPlan(stripeSubscriptionItemPriceId) !== "custom" &&
      role !== "ADMINISTRATOR"
    ) {
      throw new PaymentRequired(
        "Enhanced access control requires custom pricing"
      );
    }

    if (!emailValidator.validate(email)) {
      throw new BadRequest("Invalid email address");
    }

    const tenant = ctx.tenantContext;
    const origin = validateOrigin(ctx.request.header);

    if (!origin) {
      throw new BadRequest("Invalid Origin");
    }

    const code = await inviteUser({
      email,
      origin,
      role,
      tenant,
      userId,
      inviteSource,
      channel,
      ownerFirstName,
    });
    const encryptedCode = encrypt(code);

    await sendTrackEvent({
      body: { inviteeEmail: email, inviteSource, channel },
      key:
        inviteSource === "onboarding"
          ? "onboarding-invite-sent"
          : "invite-sent",
      tenantId: tenant.tenantId,
      userId,
    });

    ctx.body = { code: encryptedCode };
  }
);

invitations.get("/", async (ctx) => {
  const { role, tenantId, userId } = ctx.userContext;
  const invitationList = await invitationObject.list({ tenantId });
  const showInvitations = hasCapability(role, "user:InviteUser", "*");

  // do not show courier users in team list for external users
  const filtered = (await isCourierUser(userId))
    ? invitationList.objects
    : invitationList.objects.filter(
        (invitation) => !hasCourierEmail(invitation?.json?.email)
      );

  const cleaned = !showInvitations
    ? filtered.map((invitation) => {
        // filter out join requests
        if (invitation.json.isRequest) {
          return;
        }

        // do not remove these deletions!
        delete invitation.title;
        delete invitation.json.code;
        return invitation;
      })
    : filtered
        .map((invitation) => {
          const code = invitation.json.code;
          invitation.json.code = encrypt(code);
          invitation.title = encrypt(invitation.title);

          return invitation;
        })
        .filter(Boolean);

  ctx.body = {
    invitations: cleaned,
  };
});

invitations.delete(
  "/:code",
  requireCapabilityMiddleware("user:InviteUser"),
  async (context) => {
    const { tenantId, userId } = context.userContext;
    const code = assertPathParam(context, "code");
    const decryptedCode = decrypt(code);
    await invitationObject.remove({ code: decryptedCode, tenantId, userId });

    context.status = 204;
  }
);

invitations.get("/requests", async (ctx) => {
  const { userId } = ctx.userContext;
  const requests = await tenantRequest.list(userId);
  ctx.body = {
    requests: requests.map((request) => ({
      expires: request.expires,
      tenantId: request.data.tenantId,
    })),
  };
});

invitations.post(
  "/requests",
  rateLimitMiddleware("tenant/request"),
  async (ctx) => {
    const { message, tenantId: requestedTenantId } = assertBody(ctx) as {
      message: string;
      tenantId: string;
    };
    const { userId } = ctx.userContext;
    const requestedTenant = await getTenant(requestedTenantId);

    const requestedTenantOwnerId =
      requestedTenant.owner || requestedTenant.creator;
    const requestedTenantOwner = await getUser(requestedTenantOwnerId);
    const requester = await getUser(userId);

    const origin = validateOrigin(ctx.request.header);

    if (!origin) {
      throw new BadRequest("Invalid Origin");
    }

    const code = await tenantRequest.request({
      message,
      origin,
      owner: requestedTenantOwner,
      requester,
      tenant: requestedTenant,
    });

    ctx.body = { code: encrypt(code) };
  }
);

invitations.post(
  "/requests/:code/approve",
  requireCapabilityMiddleware("user:InviteUser"),
  async (ctx) => {
    const code = assertPathParam(ctx, "code");
    const decryptedCode = decrypt(code);
    await tenantRequest.approve(decryptedCode, ctx.tenantContext);
    ctx.status = 204;
  }
);

invitations.post(
  "/bulk",
  requireCapabilityMiddleware("user:InviteUser"),
  rateLimitMiddleware("bulk-invites"),
  async (ctx) => {
    const bulkInvitations = assertBody(ctx) as IInvitationEmail[];

    if (!bulkInvitations.length) {
      throw new BadRequest("Empty list of users");
    }

    if (bulkInvitations.length > 20) {
      throw new BadRequest("Cannot invite more than 20 users");
    }

    const { userId } = ctx.userContext;
    const { stripeSubscriptionItemPriceId } = ctx.tenantContext;

    if (
      bulkInvitations.some(
        (invitation) => !emailValidator.validate(invitation.email)
      )
    ) {
      throw new BadRequest("Invalid email address");
    }

    if (
      bulkInvitations.some(
        (invitation) =>
          findPricingPlan(stripeSubscriptionItemPriceId) !== "custom" &&
          invitation.role &&
          invitation.role !== "ADMINISTRATOR"
      )
    ) {
      throw new PaymentRequired(
        "Enhanced access control requires custom pricing"
      );
    }

    const tenant = ctx.tenantContext;
    const origin = validateOrigin(ctx.request.header);

    if (!origin) {
      throw new BadRequest("Invalid Origin");
    }

    await Promise.all(
      bulkInvitations.map(async (invitation) => {
        try {
          await inviteUser({
            email: invitation.email,
            origin,
            role: invitation.role ?? "ADMINISTRATOR",
            tenant,
            userId,
          });
        } catch (err) {
          throw new Error("Could not send invites to all the users");
        }

        await sendTrackEvent({
          body: { inviteeEmail: invitation.email },
          key: "invite-sent",
          tenantId: tenant.tenantId,
          userId,
        });
      })
    );

    ctx.status = 204;
  }
);

export default invitations;
