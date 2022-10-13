import * as brands from "~/lib/brands";
import { IBrand } from "~/lib/brands/types";
import { NotFound } from "~/lib/http-errors";
import createEncodedId from "../lib/create-encoded-id";
import DataSource from "../lib/data-source";

export default class BrandsDataSource extends DataSource {
  get objtype(): string {
    return "brand";
  }

  public async get(brandId: string) {
    try {
      const tenantId = this.getEnvScopedTenantId();
      const brand = await brands.get(tenantId, brandId);
      return this.map(brand);
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  protected map = (brand: IBrand) => {
    if (!brand) {
      return null;
    }

    // RegEx extracts the brandId (and optionally the versionId) from the
    // value stored in the database
    // Possible formats:
    //   - {brandId}
    //   - {brandId}/version/{versionId}
    //   - brand/{brandId}
    //   - brand/{brandId}/version/{versionId}
    const [, brandId] = brand?.id?.match(
      /^(?:brand\/)?(.+?)(?:\/version\/(.+))?$/
    );

    return {
      brandId,
      created: brand.created,
      id: createEncodedId(brandId, this.objtype),
      name: brand.name,
      updated: brand.updated,
    };
  };
}
