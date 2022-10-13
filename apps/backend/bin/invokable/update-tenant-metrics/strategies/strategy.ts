import { warn } from "~/lib/log";
import { ITenant } from "~/types.api";

export interface ITenantMetricCollection {
  [key: string]: number;
}

export default class Strategy {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  public async collect(
    // tslint:disable-next-line: variable-name
    _tenant: ITenant
  ): Promise<ITenantMetricCollection | ITenantMetricCollection[]> {
    warn(`collect() method must be implemented for ${this.name}`);
    return {};
  }
}
