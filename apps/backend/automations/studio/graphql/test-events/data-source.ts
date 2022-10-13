import { DataSourceConfig } from "apollo-datasource";
import createEncodedId from "~/studio/graphql/lib/create-encoded-id";
import DataSource from "~/studio/graphql/lib/data-source";
import { IContext } from "~/studio/graphql/types";
import TestEventService from "../../../lib/services/test-events";
import { IAutomationTestEvent } from "../../../types";

export default class AutomationTestEventsDataSource extends DataSource {
  protected testEventService: ReturnType<typeof TestEventService>;

  get objtype(): string {
    return "automation-test-event";
  }

  public initialize(config: DataSourceConfig<IContext>) {
    super.initialize(config);
    this.testEventService = TestEventService(this.getEnvScopedTenantId());
  }

  public async list(templateId: string) {
    const objects = await this.testEventService.get(templateId);

    return {
      items: objects.map(this.map),
    };
  }

  public async save(templateId: string, testEvent: IAutomationTestEvent) {
    await this.testEventService.save(templateId, testEvent);

    return this.map(testEvent);
  }

  public async remove(templateId: string, testEventId: string) {
    await this.testEventService.remove(templateId, testEventId);

    return testEventId;
  }

  protected map = (testEvent: IAutomationTestEvent) => {
    return {
      created: testEvent.created,
      id: createEncodedId(testEvent.testEventId, this.objtype),
      label: testEvent.label,
      testEvent: testEvent.testEvent,
      testEventId: testEvent.testEventId,
      updated: testEvent.updated,
    };
  };
}
