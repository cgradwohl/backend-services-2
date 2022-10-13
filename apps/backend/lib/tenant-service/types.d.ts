import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface IAcceptBrandsFn {
  (key: ITenantKey): Promise<void>;
}

export interface ITenantKey extends DocumentClient.Key {
  tenantId: string;
}
