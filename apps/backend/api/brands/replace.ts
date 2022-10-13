import {
  BrandNotFoundError,
  replace as replaceBrand,
  validate,
} from "~/lib/brands";
import { NotFound } from "~/lib/http-errors";
import { assertBody, assertPathParam } from "~/lib/lambda-response";
import { transformRequest, transformResponse } from "./transforms/item";
import { PutFn, PutRequestBody } from "./types";

const replace: PutFn = async (context) => {
  const id = assertPathParam(context, "id");
  const { tenantId } = context;
  const brand = transformRequest(
    assertBody<PutRequestBody>(context, { validateFn: validate })
  );

  try {
    const updatedBrand = await replaceBrand(
      tenantId,
      `tenant/${tenantId}`,
      id,
      brand,
      { publish: true }
    );
    const body = transformResponse(updatedBrand);
    return { body };
  } catch (err) {
    if (err instanceof BrandNotFoundError) {
      throw new NotFound();
    }
    throw err;
  }
};

export default replace;
