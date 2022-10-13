import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface ICustomerTenantLookupKey extends DocumentClient.Key {
  customerId: string;
}
