export const TENANT_ID = "a-tenant-id";

const getConfiguration = (json?: { [key: string]: any }) => ({
  created: 141241241241,
  creator: "424242424242",
  id: "an-id",
  json: {
    provider: "sendgrid",
    ...json,
  },
  objtype: "configuration",
  tenantId: TENANT_ID,
  title: "Configuration",
});

export default getConfiguration;
