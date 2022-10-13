import { NotFound } from "~/lib/http-errors";
import jsonStore from "~/lib/s3";
import { ITemplateLocales } from "~/types.api";

const { get: getLocales, put: putLocales } = jsonStore<ITemplateLocales>(
  process.env.S3_TEMPLATE_VARIATIONS_BUCKET
);

// Note: associatedId = ID of the object the check belongs to (ex. notification ID)

export const get = async ({
  tenantId,
  id,
}: {
  tenantId: string;
  id: string;
}) => {
  try {
    const result = await getLocales(`${tenantId}/${id}`);
    return result;
  } catch (err) {
    if (err instanceof NotFound) {
      return {};
    }
    throw err;
  }
};

export const put = async ({
  tenantId,
  id,
  locales,
}: {
  tenantId: string;
  id: string;
  locales: ITemplateLocales;
}) => {
  await putLocales(`${tenantId}/${id}`, locales);
};
