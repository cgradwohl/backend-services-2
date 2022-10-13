import { DataSourceConfig } from "apollo-datasource";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dynamoDbObjectService from "~/lib/dynamo/object-service";
import { preferenceSectionService } from "~/preferences/services/section-service";
import { IPreferenceSectionDataInput } from "~/preferences/types";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";
import { IContext } from "~/studio/graphql/types";

export const objType = "preference-section";

export default class PreferenceSectionDataSource extends DataSource {
  protected objectService: ReturnType<typeof dynamoDbObjectService>;
  protected preferenceSectionService: ReturnType<
    typeof preferenceSectionService
  >;

  get objtype(): string {
    return objType;
  }

  public initialize(config: DataSourceConfig<IContext>) {
    super.initialize(config);
    this.objectService = dynamoDbObjectService(this.objtype);
    this.preferenceSectionService = preferenceSectionService(
      this.getEnvScopedTenantId(),
      this.context.user?.id
    );
  }

  public async add(sectionId: string, groupId: string): Promise<void> {
    await this.preferenceSectionService.updateSectionForGroup(
      sectionId,
      groupId
    );
    return this.map(await this.preferenceSectionService.get(sectionId));
  }

  public async save(section: IPreferenceSectionDataInput): Promise<any> {
    return this.map(await this.preferenceSectionService.saveSection(section));
  }

  public async deleteSection(sectionId) {
    try {
      await this.preferenceSectionService.deleteSection(sectionId);
      return {
        success: true,
      };
    } catch (e) {
      return {
        success: false,
      };
    }
  }

  public get = async (sectionId: string) =>
    this.map(await this.preferenceSectionService.get(sectionId));

  public async list(): Promise<[any[], DocumentClient.Key]> {
    const response = await this.preferenceSectionService.list();
    return [
      response.Items.map((section) => this.map(section)),
      response.LastEvaluatedKey,
    ];
  }

  protected map = (section) => {
    if (!section) {
      return null;
    }

    const id = section.sectionId;

    return {
      ...section,
      hasCustomRouting: section.hasCustomRouting || false,
      sectionId: id,
      id: createEncodedId(id, this.objtype),
    };
  };
}
