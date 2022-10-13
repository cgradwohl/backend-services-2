import KoaRouter from "koa-router";

import * as brands from "~/lib/brands";
import renderBrandPreviewTemplate from "~/lib/brands/render-preview-template";
import { BadRequest, Conflict, NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/koa-assert";
import { rateLimitMiddleware } from "~/lib/middleware";
import { update as updateSettings } from "~/lib/settings-service";
import { update as updateTenant } from "~/lib/tenant-service";
import requireCapabilityMiddleware from "../middleware/require-capability";

import {
  IStudioBrandsPatchRequestBody,
  IStudioBrandsPostRequestBody,
  IStudioBrandsPutRequestBody,
} from "./types";

const router = new KoaRouter();

router.put(
  "/opt-in",
  requireCapabilityMiddleware("tenant:WriteItem"),
  async (context) => {
    const { tenantId } = context.userContext;
    await updateTenant({ tenantId }, { brandsAccepted: true });
    context.status = 204;
  }
);

router.put(
  "/:id/default",
  requireCapabilityMiddleware("brand:WriteItem", { resourceIdentifier: "id" }),
  async (context) => {
    const { tenantId, userId } = context.userContext;
    const id = assertPathParam(context, "id");
    const brand = await brands.get(tenantId, id);

    if (!brand) {
      throw new brands.BrandNotFoundError();
    }

    try {
      await updateSettings<string>(
        { id: "defaultBrandId", tenantId, userId },
        brand.id
      );
      context.status = 204;
    } catch (err) {
      if (err instanceof brands.BrandNotFoundError) {
        throw new NotFound(`brand/${id} not found`);
      }
      if (err instanceof brands.BrandNotPublishedError) {
        throw new BadRequest(`brand/${id} must be published`);
      }
      throw err;
    }
  }
);

router.get("/:id/versions", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  ctx.body = await brands.listVersions(tenantId, id);
});

router.get("/:id/versions/:version", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const version = assertPathParam(ctx, "version");
  const { tenantId } = ctx.userContext;
  ctx.body = await brands.getVersion(tenantId, id, version);
});

router.post(
  "/:id/versions/:version/publish",
  requireCapabilityMiddleware("brand:WriteItem", { resourceIdentifier: "id" }),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const version = assertPathParam(ctx, "version");
    const { tenantId, userId } = ctx.userContext;

    const published = await brands.publish({ id, tenantId, userId }, version);
    ctx.body = { published };
  }
);

router.get("/:id", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  const brand = await brands.get(tenantId, id);

  if (!brand) {
    throw new NotFound(`Brand ${id} not found`);
  }

  ctx.body = brand;
});

router.get("/:id/latest", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;
  const brand = await brands.getLatest(tenantId, id);

  if (!brand) {
    throw new NotFound(`Brand ${id} not found`);
  }

  ctx.body = brand;
});

router.get("/:id/template-preview", async (ctx) => {
  const id = assertPathParam(ctx, "id");
  const { tenantId } = ctx.userContext;

  try {
    const { templates } = await renderBrandPreviewTemplate(tenantId, id);
    ctx.body = templates;
  } catch (ex) {
    ctx.body = {
      error: String(ex),
    };
  }
});

router.delete(
  "/:id",
  requireCapabilityMiddleware("brand:WriteItem", { resourceIdentifier: "id" }),
  async (ctx) => {
    try {
      const id = assertPathParam(ctx, "id");
      const { tenantId } = ctx.userContext;
      await brands.remove(tenantId, id);
      ctx.status = 204;
    } catch (err) {
      if (err instanceof brands.CannotArchiveDefaultBrandError) {
        throw new Conflict(err.message);
      } else {
        throw err;
      }
    }
  }
);

router.patch(
  "/:id",
  requireCapabilityMiddleware("brand:WriteItem", { resourceIdentifier: "id" }),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const { tenantId, userId } = ctx.userContext;
    const body = assertBody<IStudioBrandsPatchRequestBody>(ctx);
    try {
      ctx.body = await brands.patch(tenantId, id, userId, body.patch);
    } catch (err) {
      if (err instanceof brands.BadPatchRequestError) {
        throw new BadRequest(err.message);
      }
      throw err;
    }
  }
);

router.put(
  "/:id",
  requireCapabilityMiddleware("brand:WriteItem", { resourceIdentifier: "id" }),
  async (ctx) => {
    const id = assertPathParam(ctx, "id");
    const { tenantId, userId } = ctx.userContext;
    const body = assertBody<IStudioBrandsPutRequestBody>(ctx, brands.validate);
    ctx.body = await brands.replace(tenantId, userId, id, body);
  }
);

router.get("/", async (ctx) => {
  const { exclusiveStartKey } = ctx.request.query;
  const { tenantId } = ctx.userContext;
  const { items, lastEvaluatedKey } = await brands.list(
    tenantId,
    exclusiveStartKey
  );

  ctx.body = {
    items,
    nextPageUrl: lastEvaluatedKey
      ? `/studio/brands?exclusiveStartKey=${lastEvaluatedKey.id}`
      : null,
  };
});

router.post(
  "/",
  requireCapabilityMiddleware("brand:WriteItem"),
  rateLimitMiddleware("objects"),
  async (ctx) => {
    const { tenantId, userId } = ctx.userContext;
    const body = assertBody<IStudioBrandsPostRequestBody>(ctx, brands.validate);

    try {
      ctx.body = await brands.create(tenantId, userId, body);
    } catch (err) {
      if (err instanceof brands.DuplicateBrandIdError) {
        throw new Conflict(`Brand (${body.id}) already exists`);
      }

      throw err;
    }
  }
);

export default router;
