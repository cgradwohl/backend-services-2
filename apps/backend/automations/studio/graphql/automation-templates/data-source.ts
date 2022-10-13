import { DataSourceConfig } from "apollo-datasource";
import AutomationTemplateSchedulerService from "~/automations/lib/services/scheduler";
import AutomationTemplateService from "~/automations/lib/services/templates";
import {
  IAutomationTemplate,
  IAutomationTemplateSource,
  IScheduleItem,
} from "~/automations/types";
import { assertValidScope } from "~/lib/assertions/is-valid-scope-state";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";
import { IContext } from "~/studio/graphql/types";
import { IProfile } from "~/types.api";

export default class AutomationTemplatesDataSource extends DataSource {
  get templateObjtype(): string {
    return "automation-template";
  }

  get scheduleItemObjtype(): string {
    return "automation-schedule-item";
  }

  get sourceObjtype(): string {
    return "automation-source";
  }
  protected automationTemplateService: ReturnType<
    typeof AutomationTemplateService
  >;

  protected automationScheduleService: ReturnType<
    typeof AutomationTemplateSchedulerService
  >;

  public initialize(config: DataSourceConfig<IContext>) {
    super.initialize(config);

    const { env } = this.context;
    // we want the gql consumers to always use draft templates
    const scope = env === "test" ? "draft/test" : "draft/production";

    this.automationTemplateService = AutomationTemplateService(
      this.getEnvScopedTenantId(),
      scope
    );

    // drafts not yet supported for schedule
    const scheduleScope =
      env === "test" ? "published/test" : "published/production";

    assertValidScope(scheduleScope);

    this.automationScheduleService = AutomationTemplateSchedulerService(
      this.getEnvScopedTenantId(),
      scheduleScope
    );
  }

  public async updateName(name: string, templateId: string) {
    const updatedAt = await this.automationTemplateService.updateName(
      name,
      templateId
    );
    return updatedAt;
  }

  public async updateAlias(alias: string, templateId: string) {
    return this.automationTemplateService.updateAlias(alias, templateId);
  }

  public async updateCancelationToken(token: string, templateId: string) {
    return this.automationTemplateService.updateCancelationToken(
      token,
      templateId
    );
  }

  public async save(template: IAutomationTemplate) {
    const { updatedAt } = await this.automationTemplateService.save(template);

    const savedTemplate = {
      ...template,
      updatedAt,
    };

    return this.map(savedTemplate);
  }

  public async publish(templateId: string) {
    const { publishedAt, publishedVersion } =
      await this.automationTemplateService.publish(templateId);

    return {
      publishedAt,
      publishedVersion,
      templateId,
    };
  }

  public async get(templateId: string) {
    const template = await this.automationTemplateService.get(templateId);

    if (!template) {
      return null;
    }

    return this.map(template);
  }

  public async list() {
    const tenantId = this.getEnvScopedTenantId();
    const templates = await this.automationTemplateService.list(tenantId);

    return {
      items: templates.map(this.map),
    };
  }

  public async delete(templateId: string) {
    await this.automationTemplateService.delete(templateId);
  }

  public async render(template: string, data: any, profile: IProfile) {
    const renderedTemplate = await this.automationTemplateService.render(
      template,
      data,
      profile
    );

    return renderedTemplate;
  }

  public async getSchedule(templateId: string) {
    const schedule = await this.automationScheduleService.get(templateId);

    if (!schedule) {
      return { nodes: [] };
    }

    return {
      nodes: schedule.map(this.mapScheduleItem),
    };
  }

  public async saveScheduleItem(item: IScheduleItem) {
    const ttl = this.automationScheduleService.calculateTTL(item.value);

    await this.automationScheduleService.saveItem({
      ...item,
      ttl,
    });

    return this.mapScheduleItem({
      ...item,
      ttl,
    });
  }

  public async deleteScheduleItem(templateId: string, itemId: string) {
    await this.automationScheduleService.deleteItem(templateId, itemId);
  }

  public async getSources(templateId: string) {
    const sources =
      await this.automationTemplateService.fetchPublishedSourcesByTemplateId(
        templateId
      );

    if (!sources) {
      return { nodes: [] };
    }

    return {
      nodes: sources.map(this.mapSourceItem),
    };
  }

  public async saveSource(
    templateId: string,
    newSource: string,
    oldSource: string
  ) {
    const sourceItem = await this.automationTemplateService.saveSource(
      templateId,
      newSource,
      oldSource
    );
    return this.mapSourceItem(sourceItem);
  }

  public async deleteSource(templateId: string, source: string) {
    await this.automationTemplateService.deleteSource(templateId, source);
  }

  protected map = (template: IAutomationTemplate) => {
    return {
      alias: template.alias,
      cancelationToken: template.cancelation_token,
      createdAt: template.createdAt,
      id: createEncodedId(template.templateId, this.templateObjtype),
      publishedAt: template.publishedAt,
      publishedVersion: template.publishedVersion,
      updatedAt: template.updatedAt,
      name: template.name,
      template: template.template,
      json: template.json,
      templateId: template.templateId,
    };
  };

  protected mapScheduleItem = (item: IScheduleItem) => {
    return {
      enabled: item.enabled,
      id: createEncodedId(item.itemId, this.scheduleItemObjtype),
      itemId: item.itemId,
      templateId: item.templateId,
      value: item.value,
    };
  };

  protected mapSourceItem = (item: IAutomationTemplateSource) => ({
    source: item.source,
    id: createEncodedId(item.source, this.sourceObjtype),
    templateId: item.templateId,
    tenantId: item.tenantId,
    createdAt: item.createdAt,
    type: item.type,
  });
}
