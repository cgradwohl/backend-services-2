import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface ITagKey extends DocumentClient.Key {
  tenantId: string;
  id?: string;
}
