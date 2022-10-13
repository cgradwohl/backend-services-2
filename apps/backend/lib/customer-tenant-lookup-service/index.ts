import { ICustomerTenantLookup } from "~/types.internal";

import dynamoStoreService from "../dynamo/store-service";
import { ICustomerTenantLookupKey } from "./types";

const tableName = process.env.CUSTOMER_TENANT_LOOKUP_TABLE_NAME;

const service = dynamoStoreService<
  ICustomerTenantLookup,
  ICustomerTenantLookupKey
>(tableName);

export const get = service.get;
export const list = service.list;
export const remove = service.remove;
export const scan = service.scan;
export const update = service.update;
