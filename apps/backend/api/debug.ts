import getTenantInfo from "~/lib/get-tenant-info";
import { handleApi } from "../lib/lambda-response";
import { get as getTenant } from "~/lib/tenant-service";

const debug = handleApi(async (context) => {
  const { scope, tenantId } = context;
  const tenantInfo = getTenantInfo(tenantId);
  const { name } = await getTenant(tenantId);

  return {
    body: {
      environment: tenantInfo.environment,
      scope: scope,
      tenantId,
      tenantName: name,
    },
  };
});

export default debug;
