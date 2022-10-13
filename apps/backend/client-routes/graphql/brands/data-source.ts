import * as brands from "~/lib/brands";
import { IBrand } from "~/lib/brands/types";
import { NotFound } from "~/lib/http-errors";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";

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

  public async getVersion(brandId: string, version: string) {
    try {
      const tenantId = this.getEnvScopedTenantId();
      const brand = await brands.getVersion(tenantId, brandId, version);
      return this.map(brand);
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  public async getDefault() {
    try {
      const tenantId = this.getEnvScopedTenantId();
      const brand = await brands.getDefault(tenantId);
      return this.map(brand);
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  // returns InApp brand if configured,
  // else falls back on default brand for back-compat
  public async getInApp() {
    try {
      const tenantId = this.getEnvScopedTenantId();
      const brand = await brands.getInApp(tenantId);
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

    const brandColors = brand?.settings?.colors;
    const brandLogo = brand?.settings?.email?.header?.logo;

    if (brand?.settings?.inapp?.widgetBackground) {
      const { topColor, bottomColor } = brand.settings.inapp.widgetBackground;
      brand.settings.inapp.widgetBackground = {
        topColor: this.getBrandColor(brandColors, topColor),
        bottomColor: this.getBrandColor(brandColors, bottomColor),
      };
    }

    if (brand?.settings?.inapp?.emptyState?.textColor) {
      const brandColors = brand?.settings?.colors;
      const { textColor } = brand.settings.inapp.emptyState;
      brand.settings.inapp.emptyState.textColor = this.getBrandColor(
        brandColors,
        textColor
      );
    }

    return {
      brandId,
      created: brand.created,
      id: createEncodedId(brandId, this.objtype),
      settings: brand.settings,
      links: brand.settings.email?.footer?.social ?? {},
      logo: brandLogo ?? {},
    };
  };

  private getBrandColor = (
    brandColors: IBrand["settings"]["colors"],
    color: string
  ) => {
    const colorMatch = (color || "").match(/{brand.colors.(.*)}/);
    if (colorMatch) {
      return brandColors[colorMatch[1]];
    }

    return color;
  };
}
