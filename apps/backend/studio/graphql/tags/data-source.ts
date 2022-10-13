import { NotFound } from "~/lib/http-errors";
import { get as getTag } from "~/lib/tags-service";
import createEncodedId from "../lib/create-encoded-id";
import DataSource from "../lib/data-source";

import { ITag } from "~/types.api";

export default class CategoriesDataSource extends DataSource {
  get objtype(): string {
    return "tag";
  }

  public async get(tagId: string) {
    try {
      const tenantId = this.getEnvScopedTenantId();
      const tag = await getTag({ id: tagId, tenantId });
      return this.map(tag);
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  protected map = (tag: ITag) => {
    if (!tag) {
      return null;
    }

    return {
      color: tag.color,
      created: tag.created,
      id: createEncodedId(tag.id, this.objtype),
      name: tag.label,
      tagId: tag.id,
    };
  };
}
