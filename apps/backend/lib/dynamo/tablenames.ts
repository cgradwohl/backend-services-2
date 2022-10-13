// Note: For legacy tables only. Do not add new table names here.
// See https://github.com/trycourier/backend/pull/2241/files for example on adding a new table.

export type TableName =
  | "DOMAINS_TABLE_NAME"
  | "CODES_TABLE_NAME"
  | "EVENT_MAPS_TABLE"
  | "MESSAGES_TABLE_NAME"
  | "OBJECTS_TABLE_NAME"
  | "PROFILES_TABLE_NAME"
  | "TENANT_ACCESS_RIGHTS_TABLE_NAME"
  | "TENANT_AUTH_TOKENS_TABLE_NAME"
  | "TENANTS_TABLE_NAME";

export const TABLE_NAMES: { [key in TableName]: TableName } = {
  DOMAINS_TABLE_NAME: "DOMAINS_TABLE_NAME",
  CODES_TABLE_NAME: "CODES_TABLE_NAME",
  EVENT_MAPS_TABLE: "EVENT_MAPS_TABLE",
  MESSAGES_TABLE_NAME: "MESSAGES_TABLE_NAME",
  OBJECTS_TABLE_NAME: "OBJECTS_TABLE_NAME",
  PROFILES_TABLE_NAME: "PROFILES_TABLE_NAME",
  TENANTS_TABLE_NAME: "TENANTS_TABLE_NAME",
  TENANT_ACCESS_RIGHTS_TABLE_NAME: "TENANT_ACCESS_RIGHTS_TABLE_NAME",
  TENANT_AUTH_TOKENS_TABLE_NAME: "TENANT_AUTH_TOKENS_TABLE_NAME",
};

const TableNameMap: { [key in TableName]: string } = {
  DOMAINS_TABLE_NAME: "domains",
  CODES_TABLE_NAME: "codes",
  EVENT_MAPS_TABLE: "event-maps",
  MESSAGES_TABLE_NAME: "messages-v2",
  OBJECTS_TABLE_NAME: "objects",
  PROFILES_TABLE_NAME: "profiles",
  TENANTS_TABLE_NAME: "tenants",
  TENANT_ACCESS_RIGHTS_TABLE_NAME: "tenant-access-rights",
  TENANT_AUTH_TOKENS_TABLE_NAME: "tenant-auth-tokens",
};

const getTableName = (table: TableName) =>
  process.env[table] ?? `${process.env.PREFIX}-${TableNameMap[table]}`;

export default getTableName;
