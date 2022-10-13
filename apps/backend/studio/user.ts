import { add, formatISO } from "date-fns";
import { sign } from "jsonwebtoken";
import KoaRouter from "koa-router";
import { emitUserLogoutEvent } from "~/auditing/services/emit";
import { getUser } from "~/lib/cognito";
import getUserByToken from "~/lib/cognito/get-user-by-token";
import courierHttp from "~/lib/courier-http";
import handleErrorLog from "~/lib/handle-error-log";
import { BadRequest, NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import { error } from "~/lib/log";
import { findPricingPlan } from "~/lib/plan-pricing";
import { sendTrackEvent } from "~/lib/segment";
import * as sessionManagementService from "~/lib/session-management-service";
import * as tenantAccessRightsService from "~/lib/tenant-access-rights-service";
import getApiKey from "~/lib/tenant-service/get-api-key";
import { deleteUser } from "~/lib/users";
import requireCapabilityMiddleware from "./middleware/require-capability";
import verifyUserResource from "./middleware/verify-user-resource";

const users = new KoaRouter();

users.post("/logout", async (context) => {
  const { tenantId, userId } = context.userContext;
  const key = sessionManagementService.namespaceKeys.JWT_SIGNATURE;
  try {
    const token = context.request.header.authorization.replace("Bearer ", "");
    const signature = token.split(".")[2];
    await sessionManagementService.create({ namespace: `${key}:${signature}` });
    await sendTrackEvent({ key: "user-signed-out", tenantId, userId });

    let userObj: { id: string; email: string };

    try {
      const user = await getUser(userId);
      userObj = { id: userId, email: user.email };
    } catch (err) {
      userObj = { id: userId, email: "" };
    }

    await emitUserLogoutEvent(
      "published/production",
      new Date(),
      userObj,
      tenantId
    );
  } catch (e) {
    error(e);
  }
  context.status = 200;
});

// this route exists in Studio (instead of Public) as it requires
// access to the tenants auth token table to auto-populate
// the api explorer for our readme.io documentation site
users.post("/sso/documentation/token", async (context) => {
  const { tenantId } = context.userContext;
  const { accessToken } = assertBody(context) as { accessToken: string };
  const ssoDocumentationSecret = process.env.SSO_DOCUMENTATION_SECRET;

  if (!ssoDocumentationSecret) {
    error("Missing SSO_DOCUMENTATION_SECRET");
    context.status = 500;
    return;
  }

  try {
    const { email } = await getUserByToken(accessToken);
    const name = email.split("@")[0];

    interface ISsoDocumentionTokenPayload {
      apiKey?: string;
      email: string;
      name: string;
      version: number;
    }

    const payload: ISsoDocumentionTokenPayload = {
      email,
      name,
      version: 1,
    };

    // auto-populate tenant apiKey to enable usage of the
    // "try it" api explorer feature in readme.io
    try {
      const apiKey = await getApiKey(tenantId);
      if (apiKey) {
        payload.apiKey = apiKey;
      }
    } catch (e) {
      // do not throw as users can still authenticate without
      // their tenant's apiKey
      error("Error populating SSO:Documenatation apiKey");
    }

    context.body = { token: sign(payload, ssoDocumentationSecret) };
    context.status = 200;
  } catch (e) {
    handleErrorLog(e);
    throw new BadRequest("Error Generating SSO:Documentation Sign In Response");
  }
});

users.post("/mobile-login-reminder", async (context) => {
  const { userId } = context.userContext;

  // @ts-ignore
  const email = context.req?.event?.requestContext?.authorizer?.claims?.email;

  const delayUntil = formatISO(add(new Date(), { hours: 3 }));

  const run = {
    automation: {
      steps: [
        {
          action: "delay",
          delayUntil,
        },
        {
          action: "send",
        },
      ],
    },
    profile: {
      email,
    },
    recipient: userId,
    template: "MOBILE-REMINDER",
  };

  const courier = courierHttp();
  await courier.post("/automations/invoke", run);

  context.status = 200;
});

users.put(
  "/:id/role",
  verifyUserResource(),
  requireCapabilityMiddleware("user:WriteItem"),
  async (context) => {
    const { tenantId, userId } = context.userContext;
    const { stripeSubscriptionItemPriceId } = context.tenantContext;
    const id = assertPathParam(context, "id");
    const { role } = assertBody<{ role: string }>(context);

    if (!role) {
      throw new BadRequest("role is required");
    }

    if (
      findPricingPlan(stripeSubscriptionItemPriceId) === "good" &&
      role !== "ADMINISTRATOR"
    ) {
      throw new BadRequest(
        "Starter tier customers can only set the Administrator role."
      );
    }

    try {
      await tenantAccessRightsService.setRole(tenantId, id, role, userId);
      context.status = 204;
    } catch (err) {
      if (err instanceof tenantAccessRightsService.UserNotFoundError) {
        throw new NotFound();
      }
      throw err;
    }
  }
);

users.get("/:id", verifyUserResource(), async (context) => {
  const { tenantId } = context.userContext;
  const id = assertPathParam(context, "id");
  const user = await getUser(id);
  const { role } = await tenantAccessRightsService.get({
    tenantId,
    userId: id,
  });

  context.body = {
    ...user,
    role,
  };
});

users.delete(
  "/:id",
  verifyUserResource(),
  requireCapabilityMiddleware("user:WriteItem"),
  async (context) => {
    const { tenantId, userId } = context.userContext;
    const tenant = context.tenantContext;

    const userIdToDelete = assertPathParam(context, "id");
    await deleteUser(userIdToDelete, tenantId, userId);

    await sendTrackEvent({
      body: { removedUserId: userIdToDelete },
      key: "account-removed-user",
      tenantId: tenant.tenantId,
      userId,
    });

    context.status = 204;
  }
);

export default users;
