import { DataSourceConfig } from "apollo-datasource";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { toApiKey, toUuid } from "~/lib/api-key-uuid";
import dynamoDbObjectService from "~/lib/dynamo/object-service";
import {
  objType,
  preferenceTemplateService,
} from "~/preferences/services/dynamo-service";
import {
  IPreferenceAttachmentResponse,
  IPreferenceTemplate,
  IPreferenceTemplateAttachment,
} from "~/preferences/types";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";
import { IContext } from "~/studio/graphql/types";
import { IPreference, RecipientPreferences } from "~/types.public";

export default class PreferenceTemplatesDataSource extends DataSource {
  protected objectService: ReturnType<typeof dynamoDbObjectService>;
  protected preferenceTemplateService: ReturnType<
    typeof preferenceTemplateService
  >;

  get objtype(): string {
    return objType;
  }

  public initialize(config: DataSourceConfig<IContext>) {
    super.initialize(config);
    this.objectService = dynamoDbObjectService(this.objtype);
    this.preferenceTemplateService = preferenceTemplateService(
      this.getEnvScopedTenantId(),
      this.context.user?.id
    );
  }

  public async get(templateId: string) {
    const template =
      await this.preferenceTemplateService.get<IPreferenceTemplate>(
        "templates",
        toUuid(templateId)
      );
    return this.map(template);
  }

  public async save(template: IPreferenceTemplate, isCopying = false) {
    const templateId = toUuid(template?.templateId);
    const updatedTemplate = await this.preferenceTemplateService.update(
      {
        ...template,
        ...(templateId ? { templateId } : {}),
      },
      isCopying
    );
    return this.map(updatedTemplate);
  }

  public async listTemplates(): Promise<
    [IPreferenceTemplate[], DocumentClient.Key]
  > {
    const response = await this.preferenceTemplateService.list();

    const templates = response.Items.map((item) =>
      this.map({ ...item, linkedNotifications: 0 })
    );

    const templatesWithLinkedNotifications = await Promise.all(
      templates.map(async (template) => {
        const linkedNotificationsResponse =
          await this.preferenceTemplateService.list(
            "notifications",
            toUuid(template.templateId),
            true
          );
        return {
          ...template,
          linkedNotifications: linkedNotificationsResponse?.Count ?? 0,
        } as IPreferenceTemplate;
      })
    );

    return [templatesWithLinkedNotifications, response.LastEvaluatedKey];
  }

  public async listRecipientPreferences(
    recipientId: string
  ): Promise<[RecipientPreferences[], DocumentClient.Key]> {
    const response = await this.preferenceTemplateService.list();

    const fetchGroupPreferences = async (grouping: IPreferenceTemplate) => {
      const groupingResponse = await this.preferenceTemplateService.get<{
        value: IPreference;
      }>("recipients", `${recipientId}#${grouping.templateId}`);

      const { templateId, id, templateName } = grouping;

      return this.map({
        id,
        status: groupingResponse?.value?.status,
        templateId,
        templateName,
        routingPreferences: groupingResponse?.value?.hasCustomRouting
          ? groupingResponse?.value?.routingPreferences
          : [],
        hasCustomRouting: groupingResponse?.value?.hasCustomRouting,
      });
    };

    const preferences = await Promise.all(
      response.Items?.map<Promise<RecipientPreferences>>(fetchGroupPreferences)
    );

    return [preferences, response.LastEvaluatedKey];
  }

  public attachResourceToTemplate(
    attachment: IPreferenceTemplateAttachment
  ): Promise<IPreferenceAttachmentResponse> {
    return this.preferenceTemplateService.updatePreferences({
      resourceId: attachment.resourceId,
      resourceType: attachment.resourceType,
      templateId: toUuid(attachment.templateId),
      value: attachment.value || null,
    });
  }

  public async getPreferenceTemplatesByIds(
    ids: string[]
  ): Promise<[RecipientPreferences[], DocumentClient.Key]> {
    const tenantId = this.getEnvScopedTenantId();
    const templates = await Promise.all(
      ids
        ?.map(async (tId) => {
          const response = await preferenceTemplateService(
            tenantId,
            ""
          ).get<IPreferenceTemplate>("templates", toUuid(tId));
          if (!response) {
            return null;
          }
          // Add more stuff as needed like channel_order | allowed_preferences
          return this.map({
            defaultStatus: response.defaultStatus,
            templateId: toApiKey(response.templateId),
            templateName: response.templateName,
          });
        })
        .filter(Boolean)
    );
    // [TODO] Make sure we also return the lastEvaluatedKey
    // right now we are returning the lastEvaluatedKey as null because not many templates are being created
    // And I also don't see a need to paginate the preference template | categories | preferences set yet
    return [templates, null];
  }

  public async listGroupsBySection(
    sectionId: string
  ): Promise<[IPreferenceTemplate[], DocumentClient.Key]> {
    const [items, lastEvaluatedKey] =
      await this.preferenceTemplateService.listGroupsBySection(sectionId);
    return [
      items.filter(Boolean).map((item) => this.map(item)),
      lastEvaluatedKey,
    ];
  }

  protected map = (template): IPreferenceTemplate => {
    return {
      ...template,
      id: createEncodedId(template.templateId, this.objtype),
      templateId: toApiKey(template.templateId),
    };
  };
}
