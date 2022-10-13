import { get as getBrand } from "~/lib/brands";
import { NotFound } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { transformResponse } from "./transforms/item";
import { GetFn } from "./types";

const get: GetFn = async (context) => {
  const { tenantId } = context;
  const id = assertPathParam(context, "id");
  const brand = await getBrand(tenantId, id);

  if (!brand) {
    throw new NotFound();
  }

  const body = transformResponse(brand);
  return { body };
};

export default get;
