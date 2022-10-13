import { DataSourceConfig } from "apollo-datasource";
import { preferencesPageService } from "~/preferences/services/page-service";
import {
  objType,
  PreferencesPage,
} from "~/preferences/studio/graphql/page/data-source";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";
import { IContext } from "~/studio/graphql/types";

export default class PreferencePageDataSource extends DataSource {
  protected pageService: ReturnType<typeof preferencesPageService>;

  get objtype(): string {
    return objType;
  }

  public initialize(config: DataSourceConfig<IContext>): void {
    super.initialize(config);
    this.pageService = preferencesPageService(this.getEnvScopedTenantId());
  }

  public async get() {
    return this.map(await this.pageService.getPublishedPage());
  }

  // Datasource required this map function to be defined for the GraphQL schema to work.
  // More will be added to this in the future.
  protected map = (
    page: Omit<PreferencesPage, "id" | "defaultBrandId">
  ): PreferencesPage => {
    if (!page) {
      return null;
    }

    return {
      ...page,
      id: createEncodedId(page.pageId, this.objtype),
    };
  };
}
