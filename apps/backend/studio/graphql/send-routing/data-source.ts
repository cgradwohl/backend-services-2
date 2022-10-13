import {
  MessageChannels,
  MessageProviders,
  MessageRouting,
} from "~/api/send/types";
import DataSource from "../lib/data-source";
import {
  getSendRoutingStrategy,
  putSendRoutingStrategy,
  RoutingStrategy,
} from "~/lib/send-routing";

export default class SendRoutingStrategyDataSource extends DataSource {
  get objtype(): string {
    return "send-routing";
  }

  public async set(strategy: {
    routing: string;
    channels: string;
    providers: string;
  }) {
    const tenantId = this.getEnvScopedTenantId();
    await putSendRoutingStrategy({
      tenantId,
      strategy: {
        routing: JSON.parse(strategy.routing) as MessageRouting,
        channels: JSON.parse(strategy.channels) as MessageChannels,
        providers: JSON.parse(strategy.providers) as MessageProviders,
      },
    });
  }

  public async get() {
    const tenantId = this.getEnvScopedTenantId();
    return this.map(await getSendRoutingStrategy({ tenantId }));
  }

  protected map(strategy: RoutingStrategy) {
    return {
      routing: JSON.stringify(strategy.routing),
      channels: JSON.stringify(strategy.channels),
      providers: JSON.stringify(strategy.providers),
    };
  }
}
