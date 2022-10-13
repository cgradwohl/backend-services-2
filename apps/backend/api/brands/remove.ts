import {
  CannotArchiveDefaultBrandError,
  remove as removeBrand,
} from "~/lib/brands";
import { Conflict } from "~/lib/http-errors";
import { assertPathParam } from "~/lib/lambda-response";
import { RemoveFn } from "./types";

const remove: RemoveFn = async (context) => {
  try {
    const { tenantId } = context;
    const id = assertPathParam(context, "id");
    await removeBrand(tenantId, id);
    return { status: 204 };
  } catch (err) {
    if (err instanceof CannotArchiveDefaultBrandError) {
      throw new Conflict(err.message);
    } else {
      throw err;
    }
  }
};

export default remove;
