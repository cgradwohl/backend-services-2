import makeError from "make-error";
import { isAPIKey } from "~/lib/api-key-uuid";

import { getByProvider } from "~/lib/configurations-service";
import * as notificationService from "~/lib/notification-service";
import {
  get as getSettings,
  update as updateSettings,
} from "~/lib/settings-service";
import { get as getTenant } from "~/lib/tenant-service";
import { toUuid } from "../api-key-uuid";
import * as dynamodb from "../dynamo";
import dynamoObjectService, {
  ObjectAlreadyExistsError,
} from "../dynamo/object-service/publishable";
import { IPublishableObject, IPublishFn } from "../dynamo/object-service/types";
import { getPatchedDocument } from "../json-patch";
import { sendTrackEvent } from "../segment";
import { ITenantKey } from "../tenant-service/types";
import applyDefaultBrand from "./apply-default";
import fromCourierObject from "./from-courier-object";
import toCourierObject from "./to-courier-object";
import validate from "./validate";

import { emitBrandPublishedEvent } from "~/auditing/services/emit";
import { AuditEventTarget } from "~/auditing/types";
import getCourierClient from "~/lib/courier";
import { getUser } from "../cognito";
import getTableName, { TABLE_NAMES } from "../dynamo/tablenames";
import * as Brands from "./types";
const courier = getCourierClient({ allowDev: true });

const objtype = "brand";
const brands = dynamoObjectService<Brands.ICourierObjectJson>(objtype, {
  useScopedId: true,
});

export const convertBrandId = (brandId: string) =>
  brandId
    ? isAPIKey(brandId)
      ? toUuid(brandId)
      : encodeURIComponent(brandId)
    : undefined;

export const overlayMetadata = (
  courierObject: Brands.BrandCourierObject,
  brand: Brands.IBrand
): Brands.BrandCourierObject => {
  return {
    ...courierObject,
    title: brand.name,
  };
};

export const BrandNotFoundError = makeError("BrandNotFoundError");
export const BrandNotPublishedError = makeError("BrandNotPublishedError");
export const CannotArchiveDefaultBrandError = makeError(
  "CannotArchiveDefaultBrandError"
);
export const DuplicateBrandIdError = makeError("DuplicateBrandIdError");
export const BadPatchRequestError = makeError("BadPatchRequestError");

type ISetDefaultBrandFn = (key: ITenantKey, brandId: string) => Promise<void>;

export const getDefaultBrandId = async (tenantId) => {
  let defaultBrandId: string;
  try {
    defaultBrandId = await getSettings<string>({
      id: "defaultBrandId",
      tenantId,
    });
  } catch {
    const tenant = await getTenant(tenantId);
    defaultBrandId = tenant.defaultBrandId;
  }

  return defaultBrandId;
};

export const getInAppBrandId = async (tenantId) => {
  let inAppBrandId: string;
  try {
    const courierProvider = await getByProvider(tenantId, "courier");
    const providerConfig = tenantId.includes("test")
      ? courierProvider?.json?.test
      : courierProvider?.json;

    inAppBrandId = providerConfig?.inAppBrand as string;
  } catch {
    // consumers expected to have a fallback
    return null;
  }

  return inAppBrandId;
};

export const create: Brands.CreateFn = async (
  tenantId,
  creator,
  creatable,
  options = {}
) => {
  try {
    const object = toCourierObject(tenantId, creatable);

    const brand = await brands.create(
      { tenantId, userId: creator },
      {
        ...object,
        id: object.id ? convertBrandId(object.id) : null,
      },
      options
    );
    const responseObject = fromCourierObject(brand);
    await sendTrackEvent({
      body: { brand },
      key: "brand-created",
      tenantId,
      userId: creator,
    });
    return responseObject;
  } catch (err) {
    if (err instanceof ObjectAlreadyExistsError) {
      throw new DuplicateBrandIdError(creatable.id);
    }
    throw err;
  }
};

export const createDefaultBrand: Brands.CreateDefaultBrandFn = async (
  tenantId,
  userId,
  id
) => {
  const brand = await create(
    tenantId,
    userId,
    {
      id,
      name: "My First Brand",
      settings: {
        colors: {
          primary: "#9122C2",
          secondary: "#C1B6DD",
          tertiary: "#E85178",
        },
        email: {
          header: {
            barColor: "#9D3789",
          },
        },
        inapp: {
          borderRadius: "24px",
          disableMessageIcon: true,
          placement: "bottom",
        },
      },
    },
    { publish: true }
  );

  await updateSettings(
    {
      id: "defaultBrandId",
      tenantId,
      userId,
    },
    brand.id
  );
  return brand;
};

export const get: Brands.GetFn = async (tenantId, brandId, options) => {
  const id = convertBrandId(brandId);
  const item = await brands.get({ id, tenantId });
  const brand = fromCourierObject(item);

  const defaultBrandId: string = await getDefaultBrandId(tenantId);
  const isDefaultBrand = defaultBrandId === brand.id.split("/")[0];
  if (options && options.extendDefaultBrand) {
    const defaultBrand = await getDefault(tenantId);
    return {
      ...applyDefaultBrand(brand, defaultBrand),
      isDefaultBrand,
    };
  }

  return {
    ...brand,
    isDefaultBrand,
  };
};

export const getDefault: Brands.GetDefaultFn = async (tenantId) => {
  const defaultBrandId: string = await getDefaultBrandId(tenantId);

  if (!defaultBrandId) {
    return null;
  }

  const defaultBrand = await get(tenantId, defaultBrandId);
  return defaultBrand;
};

export const getInApp: Brands.GetDefaultFn = async (tenantId) => {
  const inAppBrandId: string = await getInAppBrandId(tenantId);

  if (!inAppBrandId) {
    // falls back on default brand
    return getDefault(tenantId);
  }

  const inAppBrand = await get(tenantId, inAppBrandId);
  return inAppBrand;
};

export const getLatest: Brands.GetLatestFn = async (tenantId, id) => {
  const brandId = convertBrandId(id);
  const brand = await get(tenantId, brandId);
  const latest = await brands.getLatestVersion(tenantId, brandId);

  const defaultBrandId: string = await getDefaultBrandId(tenantId);
  return {
    ...fromCourierObject(overlayMetadata(latest, brand)),
    isDefaultBrand: defaultBrandId === brand.id.split("/")[0],
  };
};

export const list: Brands.ListFn = async (tenantId, exclusiveStartKey) => {
  const { lastEvaluatedKey, objects } = await brands.list({
    exclusiveStartKey,
    tenantId,
  });

  const defaultBrandId: string = await getDefaultBrandId(tenantId);
  return {
    items: objects.map((object) => {
      const brand = fromCourierObject(
        object as IPublishableObject<Brands.ICourierObjectJson>
      );
      return {
        ...brand,
        isDefaultBrand: brand.id === defaultBrandId,
      };
    }),
    lastEvaluatedKey,
  };
};

export const getLatestDefault: Brands.GetLatestDefaultFn = async (tenantId) => {
  return getLatest(tenantId, await getDefaultBrandId(tenantId));
};

/*
NB: Currently, only the name field is patchable and only the "root" brand is
updated. To make other non-metadata fields patchable, this function will need
to be improved to support writing to both records based on the fields that are
being updated.
*/
const patchable = ["/name"];
export const patch: Brands.PatchFn = async (
  tenantId,
  brandId,
  updater,
  ops
) => {
  const filteredOps = ops.filter((op) => patchable.indexOf(op.path) > -1);
  const brand = await get(tenantId, brandId);

  let patched: Brands.IBrand;
  try {
    patched = getPatchedDocument<Brands.IBrand>(brand, filteredOps);
  } catch (err) {
    throw new BadPatchRequestError(err.message);
  }

  const updated = Date.now();

  await dynamodb.update({
    ConditionExpression: "attribute_exists(id)",
    ExpressionAttributeValues: {
      ":title": patched.name,
      ":updated": updated,
      ":updater": updater,
    },
    Key: { id: `brand/${convertBrandId(brandId)}`, tenantId },
    TableName: getTableName(TABLE_NAMES.OBJECTS_TABLE_NAME),
    UpdateExpression:
      "set title = :title, updated = :updated, updater = :updater",
  });

  return { ...patched, updated, updater };
};

export const publish: IPublishFn = async (params, version) => {
  // ensure the item exists before publishing it
  if (!(await get(params.tenantId, params.id))) {
    throw new BrandNotFoundError();
  }

  const id = convertBrandId(params.id);

  const publishResp = await brands.publish(
    {
      ...params,
      id,
    },
    version
  );

  const brand = await brands.get({ id, tenantId: params.tenantId });

  try {
    await courier.lists.send({
      data: {
        brandId: params.id,
        brandName: brand.title,
      },
      event: "BRAND_PUBLISHED",
      list: `tenant.${params.tenantId}`,
      override: {
        channel: {
          push: {
            data: {
              clickAction: `/designer/brands/${params.id}`,
              tenantId: params.tenantId,
              triggeredBy: params.userId,
            },
          },
        },
      },
    });
  } catch (ex) {
    // do nothing, list probably doesn't exist yet
  }

  // emit audit event
  let actor: { id: string; email: string };
  try {
    const { email } = await getUser(params.userId);
    actor = { email, id: params.userId };
  } catch (err) {
    actor = {
      email: "",
      id: params.userId,
    };
  }

  const target: AuditEventTarget = {
    id: params.id,
  };

  await emitBrandPublishedEvent(
    params.tenantId.includes("test")
      ? "published/test"
      : "published/production",
    new Date(),
    actor,
    params.tenantId,
    target
  );

  return publishResp;
};

export const remove: Brands.DeleteFn = async (tenantId, brandId) => {
  const id = convertBrandId(brandId);
  const defaultBrandId: string = await getDefaultBrandId(tenantId);

  if (defaultBrandId === id) {
    throw new CannotArchiveDefaultBrandError(
      `Cannot remove default brand: ${id}`
    );
  }

  const { objects: notifications } = await notificationService.list({
    tenantId,
  });

  const message = notifications
    .map(
      (notification) =>
        notification.json.brandConfig?.defaultBrandId === id &&
        `Notification ${notification.id} depends on Brand ${id}`
    )
    .filter(Boolean)
    .join(", ");

  if (message) {
    throw new CannotArchiveDefaultBrandError(message);
  }

  await brands.remove({ id, tenantId });
};

export const replace: Brands.ReplaceFn = async (
  tenantId,
  userId,
  id,
  brand,
  options = {}
) => {
  // ensure the item exists before replacing it
  if (!(await get(tenantId, id))) {
    throw new BrandNotFoundError();
  }

  const brandId = convertBrandId(id);

  const brandObject = toCourierObject(tenantId, brand);
  const item = await brands.replace(
    { id: brandId, tenantId, userId },
    {
      json: brandObject.json,
      title: brandObject.title,
    },
    options
  );

  return fromCourierObject(item);
};

export const getVersion: Brands.GetVersionFn = async (
  tenantId,
  id,
  version
) => {
  const brandId = convertBrandId(id);
  const brand = await get(tenantId, brandId);

  const response = await brands.getVersion(tenantId, brandId, version);
  return response ? fromCourierObject(overlayMetadata(response, brand)) : null;
};

export const listVersions: Brands.ListVersionsFn = async (tenantId, id) => {
  const brandId = convertBrandId(id);
  const { items, lastEvaluatedKey } = await brands.listVersions(
    tenantId,
    brandId
  );

  return {
    items: items.map(fromCourierObject),
    lastEvaluatedKey,
  };
};

export const setDefaultBrand: ISetDefaultBrandFn = async (params, brandId) => {
  const { tenantId } = params;
  const brand = await get(tenantId, brandId);

  if (!brand) {
    throw new BrandNotFoundError();
  }

  if (!brand.published) {
    throw new BrandNotPublishedError(brandId);
  }

  await updateSettings(params, brand.id);
};

export { validate };
