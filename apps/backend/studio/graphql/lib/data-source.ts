import {
  DataSource as ApolloDataSource,
  DataSourceConfig,
} from "apollo-datasource";
import { IContext } from "../types";

export default abstract class DataSource<
  TSource = any,
  TOutput = any
> extends ApolloDataSource {
  protected context: IContext;

  public initialize(config: DataSourceConfig<IContext>) {
    this.context = config.context;
  }

  protected getEnvScopedTenantId() {
    const { env, tenantId } = this.context;
    return env ? `${tenantId}/${env}` : tenantId;
  }

  protected abstract map(item: TSource): TOutput;
}
