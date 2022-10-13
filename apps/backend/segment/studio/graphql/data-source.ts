import { DataSourceConfig } from "apollo-datasource";
import AutomationTemplateService from "~/automations/lib/services/templates";
import incomingSegmentEventsFactory from "~/segment/services/incoming-events";
import { ISegmentItemWithMappings } from "~/segment/types";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";
import { IContext } from "~/studio/graphql/types";

export default class SegmentDataSource extends DataSource {
  protected incomingEventsService: ReturnType<
    typeof incomingSegmentEventsFactory
  >;

  protected automationTemplateService: ReturnType<
    typeof AutomationTemplateService
  >;

  get segmentObjtype(): string {
    return "segment";
  }

  public initialize(config: DataSourceConfig<IContext>) {
    super.initialize(config);

    this.incomingEventsService = incomingSegmentEventsFactory(
      this.getEnvScopedTenantId()
    );

    // logic borrowed from Automation Templates Data Source
    const { env } = this.context;
    const scope = env === "test" ? "draft/test" : "draft/production";

    this.automationTemplateService = AutomationTemplateService(
      this.getEnvScopedTenantId(),
      scope
    );
  }

  public async list() {
    const segmentEvents = await this.incomingEventsService.list();

    const eventsWithMappings: ISegmentItemWithMappings[] = [];

    for (const item of segmentEvents) {
      const automationTemplateMappings =
        await this.automationTemplateService.listBySource(
          item.pk.replace(`${this.getEnvScopedTenantId()}/`, "")
        );
      eventsWithMappings.push({
        automationTemplateMappings,
        item,
      });
    }

    return {
      items: eventsWithMappings.map(this.map),
    };
  }

  protected map = (segment: ISegmentItemWithMappings) => {
    const event = segment.item;
    const automationTemplateMappings = (
      segment.automationTemplateMappings ?? []
    ).map((template) => {
      return {
        alias: template.alias,
        name: template.name,
        templateId: template.templateId,
      };
    });

    return {
      automationTemplateMappings,
      eventId: event.pk.replace(`${this.getEnvScopedTenantId()}/`, ""),
      id: createEncodedId(event.pk, this.segmentObjtype),
      lastReceivedAt: event.gsi1sk,
      segmentEvent: event.segmentEvent,
    };
  };
}
