import { ErrorObject } from "ajv";
import ajv, { extractErrors as baseExtractErrors } from "~/lib/ajv";
import KoaRouter from "koa-router";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import {
  get as getProfile,
  update as updateProfile,
} from "~/lib/dynamo/profiles";

import { subscribeInApp } from "~/lib/courier-in-app";
import { getListsForProfile } from "~/lib/dynamo/profiles";
import { subscribe, unsubscribe } from "~/lib/lists";
import { rateLimitMiddleware } from "~/lib/middleware";
import { IOIDCClaims } from "~/types.api";
import { nanoid } from "nanoid";

const { COURIER_TENANT_ID } = process.env;

const profileRouter = new KoaRouter();

export interface ICsvProfile extends Partial<IOIDCClaims> {
  id: string;
  country: string;
  formatted: string;
  locality: string;
  postal_code: string;
  region: string;
  street_address: string;
}
const profileSchema = {
  $id: "http://app.courier.com/schemas-profile.json",
  additionalProperties: false,
  properties: {
    firebaseToken: {
      type: "string",
    },
    phone_number: {
      type: "string",
    },
  },
  type: "object",
};

const profileValidator = {
  validate: ajv.compile(profileSchema),
  extractErrors(data: any, errors: ErrorObject[]) {
    return baseExtractErrors(profileSchema, data, errors);
  },
};

profileRouter.post("/batch", async (ctx) => {
  const { listId, profiles } = assertBody(ctx) as {
    listId?: string;
    profiles: [ICsvProfile];
  };
  const { tenantId, userId } = ctx.userContext;
  let successfulInsertions = [];
  let failedInsertions = [];

  await Promise.all(
    profiles.map(async (profile: ICsvProfile) => {
      const {
        id = nanoid(),
        country,
        formatted,
        locality,
        postal_code,
        region,
        street_address,
        ...rest
      } = profile;
      try {
        const profileObject = {
          ...rest,
          address: {
            country,
            formatted,
            locality,
            postal_code,
            region,
            street_address,
          },
        };

        await updateProfile(tenantId, id, {
          json: JSON.stringify(profileObject),
        });

        if (listId) {
          await subscribe(tenantId, userId, listId, id);
        }
        successfulInsertions.push(id);
      } catch (error) {
        failedInsertions.push(id);
      }
    })
  );

  ctx.body = {
    success: successfulInsertions,
    failed: failedInsertions,
  };
});

profileRouter.get("/exists/:id", async (ctx) => {
  const { tenantId } = ctx.userContext;
  const profileId = assertPathParam(ctx, "id");

  const profile = await getProfile(tenantId, profileId);

  ctx.body = {
    result: Boolean(profile),
  };
});

profileRouter.get("/", async (ctx) => {
  const { tenantId, userId } = ctx.userContext;
  const profile = await getProfile(COURIER_TENANT_ID, `${tenantId}.${userId}`);
  ctx.body = profile;
});

profileRouter.put("/", rateLimitMiddleware("objects"), async (ctx) => {
  const { tenantId, userId } = ctx.userContext;
  const body = assertBody(ctx, profileValidator.validate);
  await updateProfile(COURIER_TENANT_ID, `${tenantId}.${userId}`, {
    json: JSON.stringify(body || {}),
  });

  ctx.status = 204;
});

profileRouter.put("/subscribe/in-app", async (context) => {
  const { tenantId, userId } = context.userContext;
  await subscribeInApp(userId, tenantId);
  context.status = 204;
});

profileRouter.delete("/subscribe/in-app", async (context) => {
  const { tenantId, userId } = context.userContext;

  await unsubscribe(
    process.env.COURIER_TENANT_ID,
    `tenant.${tenantId}`,
    userId
  );
  context.status = 204;
});

profileRouter.get("/subscriptions", async (context) => {
  const { userId } = context.userContext;

  const response = await getListsForProfile(
    process.env.COURIER_TENANT_ID,
    userId,
    null
  );

  context.body = response;
});

export default profileRouter;
