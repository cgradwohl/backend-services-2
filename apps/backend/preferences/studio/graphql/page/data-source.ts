import { DataSourceConfig } from "apollo-datasource";
import { nanoid } from "nanoid";
import { toApiKey } from "~/lib/api-key-uuid";
import { getDefaultBrandId } from "~/lib/brands";
import { generateHostedPreferencesLink } from "~/lib/generate-tracking-links";
import logger from "~/lib/logger";
import { preferencesPageService } from "~/preferences/services/page-service";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";
import { IContext } from "~/studio/graphql/types";
import { get as getTenant } from "~/lib/tenant-service";
import uuid from "uuid";

export type PreferencesPage = {
  draftPreviewUrl: string;
  id: string;
  pageId: string;
  publishedAt: string;
  publishedBy: string;
  publishedVersion?: number;
  showCourierFooter: boolean;
};

export const objType = "preferences-page";

export default class PreferencesPageDataSource extends DataSource {
  protected pageService: ReturnType<typeof preferencesPageService>;

  get objtype(): string {
    return objType;
  }

  public initialize(config: DataSourceConfig<IContext>) {
    super.initialize(config);
    this.pageService = preferencesPageService(this.getEnvScopedTenantId());
  }

  public async get() {
    const workspaceId = this.getEnvScopedTenantId();
    const publishedPage = await this.pageService.getPublishedPage();
    // If there is no published page, create a new temporary one
    if (!publishedPage) {
      const defaultBrandId = await getDefaultBrandId(workspaceId);
      const draftPreviewUrl = generateHostedPreferencesLink(
        workspaceId,
        defaultBrandId,
        this.context.userId
      );
      return this.map({
        draftPreviewUrl,
        pageId: uuid(),
        publishedAt: null,
        publishedBy: null,
        publishedVersion: null,
        showCourierFooter: true,
      });
    }

    return this.map(publishedPage);
  }

  public async publish(publishedAt: number) {
    const workspaceId = this.getEnvScopedTenantId();
    logger.debug(`Publishing preferences page at ${publishedAt}`);
    const defaultBrandId = toApiKey(await getDefaultBrandId(workspaceId));
    const tenantDetails = await getTenant(workspaceId);

    logger.debug(
      `Generating URL for workspace ${workspaceId}, brand ${defaultBrandId}, for user ${this.context.user?.id}`
    );
    const draftPreviewUrl = generateHostedPreferencesLink(
      workspaceId,
      defaultBrandId,
      this.context.user?.id
    );
    const pageMetadata = {
      defaultBrandId,
      draftPreviewUrl: draftPreviewUrl,
      pageId: nanoid(),
      publishedAt: new Date(publishedAt).toISOString(),
      publishedBy: this.context.user?.id,
      publishedVersion: publishedAt,
      showCourierFooter: tenantDetails?.showCourierFooter ?? true,
    };
    await this.pageService.publish(pageMetadata);
    return this.map(pageMetadata);
  }

  protected map = (
    page: Omit<PreferencesPage, "id" | "defaultBrandId">
  ): PreferencesPage => {
    if (!page) {
      return null;
    }

    return {
      ...page,
      id: createEncodedId(page.pageId, this.objtype),
      pageId: toApiKey(page.pageId),
    };
  };
}
