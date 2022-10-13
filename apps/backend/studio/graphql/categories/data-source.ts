import { get as getCategory } from "~/lib/category-service";
import { NotFound } from "~/lib/http-errors";
import { CourierObject, INotificationCategoryJson } from "~/types.api";
import createEncodedId from "../lib/create-encoded-id";
import DataSource from "../lib/data-source";

export default class CategoriesDataSource extends DataSource {
  get objtype(): string {
    return "category";
  }

  public async get(categoryId: string) {
    try {
      const tenantId = this.getEnvScopedTenantId();
      const category = await getCategory({ id: categoryId, tenantId });
      return this.map(category);
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  protected map = (category: CourierObject<INotificationCategoryJson>) => {
    if (!category) {
      return null;
    }

    return {
      categoryId: category.id,
      created: category.created,
      id: createEncodedId(category.id, this.objtype),
      name: category.title,
      updated: category.updated,
    };
  };
}
