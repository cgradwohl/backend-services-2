import {
  create as createBrand,
  DuplicateBrandIdError,
  validate,
} from "~/lib/brands";
import { Conflict } from "~/lib/http-errors";
import { assertBody } from "~/lib/lambda-response";
import { transformRequest, transformResponse } from "./transforms/item";
import { PostFn, PostRequestBody } from "./types";

const create: PostFn = async (context) => {
  const { tenantId } = context;

  const brand = transformRequest(
    assertBody<PostRequestBody>(context, { validateFn: validate })
  );

  try {
    const newBrand = await createBrand(tenantId, `tenant/${tenantId}`, brand, {
      publish: true,
    });
    const body = transformResponse(newBrand);
    return { body };
  } catch (err) {
    if (err instanceof DuplicateBrandIdError) {
      throw new Conflict(`Brand (${brand.id}) already exists`);
    }

    throw err;
  }
};

export default create;
