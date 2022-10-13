import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { toApiKey, toUuid } from "~/lib/api-key-uuid";
import { getByTemplateId as getEventMapsByTemplateId } from "~/lib/event-maps";
import { NotFound } from "~/lib/http-errors";
import {
  createPrebuiltWelcomeTemplate,
  get as getTemplate,
} from "~/lib/notification-service";
import { get as getDraft } from "~/lib/notification-service/draft";
import { preferenceTemplateService } from "~/preferences/services/dynamo-service";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";
import { CourierObject, INotificationJsonWire } from "~/types.api";
export interface ITemplate {
  archived: CourierObject["archived"];
  brandEnabled: INotificationJsonWire["brandConfig"]["enabled"];
  brandId: INotificationJsonWire["brandConfig"]["defaultBrandId"];
  categoryId: INotificationJsonWire["categoryId"];
  created: CourierObject["created"];
  draftId: INotificationJsonWire["draftId"];
  id: string;
  name: CourierObject["title"];
  tagIds: INotificationJsonWire["tagIds"];
  templateId: CourierObject["id"];
  updated: CourierObject["updated"];
}

export default class TemplatesDataSource extends DataSource {
  get objtype(): string {
    return "template";
  }

  public async get(templateId: string) {
    try {
      const tenantId = this.getEnvScopedTenantId();
      const template = await getTemplate({ id: templateId, tenantId });
      return this.map(template);
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  public async getDraft(draftId: string) {
    try {
      const tenantId = this.getEnvScopedTenantId();
      const draft = await getDraft({ tenantId, id: draftId });

      return {
        brandEnabled: draft?.json?.brandConfig?.enabled ?? false,
        brandId: draft?.json?.brandConfig?.defaultBrandId,
        created: draft.created,
        draftId: draft.id,
        id: createEncodedId(draft.id, this.objtype),
        updated: draft.updated,
      };
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  public async getEventMaps(templateId: string) {
    const tenantId = this.getEnvScopedTenantId();
    const eventMaps = await getEventMapsByTemplateId({
      tenantId,
      templateId,
    });

    return eventMaps.map((eventMap) => ({
      eventId: eventMap.eventId,
      created: eventMap.created,
      id: createEncodedId(eventMap.eventId, this.objtype),
      updated: eventMap.updated,
    }));
  }

  public async addPrebuiltTemplate(templateName: string = "quickstart") {
    const tenantId = this.getEnvScopedTenantId();
    const { user } = this.context;

    const prebuiltWelomeTemplate = await createPrebuiltWelcomeTemplate({
      tenantId,
      userId: user.id,
    });

    return {
      templateId: prebuiltWelomeTemplate?.id,
    };
  }

  public async getTemplatesBySubscriptionId(
    subscriptionId: string
  ): Promise<[ITemplate[], DocumentClient.Key]> {
    const tenantId = this.getEnvScopedTenantId();

    const response = await preferenceTemplateService(tenantId, "").list(
      "notifications",
      toUuid(subscriptionId),
      true
    );

    if (!response?.Items?.length) {
      return [[], null];
    }

    const templates = (
      await Promise.all(
        response.Items?.map((item) => this.get(item["resourceId"]))
      )
    )
      .map((template) => ({
        ...template,
        templateId: toApiKey(template.templateId),
      }))
      .filter(Boolean);

    return [templates, response.LastEvaluatedKey];
  }

  protected map = (
    template: CourierObject<INotificationJsonWire>
  ): ITemplate => {
    return {
      archived: template.archived,
      brandEnabled: template?.json?.brandConfig?.enabled ?? false,
      brandId: template?.json?.brandConfig?.defaultBrandId,
      categoryId: template?.json?.categoryId,
      created: template.created,
      draftId: template.json?.draftId,
      id: createEncodedId(template.id, this.objtype),
      name: template.title,
      tagIds: template.json?.tagIds,
      templateId: template.id,
      updated: template.updated,
    };
  };
}
