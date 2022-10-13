type GetTenantInfoFn = (
  fullTenantId: string
) => {
  environment: "production" | "test";
  tenantId: string;
};

const getTenantInfo: GetTenantInfoFn = (fullTenantId) => {
  const [tenantId, environment = "production"] = fullTenantId.split("/");

  if (environment !== "production" && environment !== "test") {
    throw new Error(`Unsupported environment used: ${environment}`);
  }

  return {
    environment,
    tenantId,
  };
};

export default getTenantInfo;
