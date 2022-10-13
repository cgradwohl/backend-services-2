import { put, query, deleteItem } from "~/lib/dynamo";

const TableName = process.env.DOMAINS_TABLE;

interface IDomainInfo {
  domain: string;
  tenantId: string;
}

export const getTenantDomains = async (
  domain: string
): Promise<IDomainInfo[]> => {
  const { Items: tenantDomains } = await query({
    ExpressionAttributeNames: {
      "#pk": "pk",
    },
    ExpressionAttributeValues: {
      ":pk": `domain/${domain}`,
    },
    KeyConditionExpression: "#pk = :pk",
    TableName,
  });

  return tenantDomains as IDomainInfo[];
};

export const addTenantToDomain = async (
  domain: string,
  tenantId: string
): Promise<void> => {
  const tenantDomains = await getTenantDomains(domain);

  if (
    tenantDomains.find((tenantDomain) => tenantDomain.tenantId === tenantId)
  ) {
    return;
  }

  await put({
    Item: {
      pk: `domain/${domain}`,
      sk: tenantId,
      domain,
      tenantId,
    },
    TableName,
  });
};

export const removeTenantFromDomain = async (
  oldDomain: string,
  tenantId: string
): Promise<void> => {
  const tenantDomains = await getTenantDomains(oldDomain);

  if (
    !tenantDomains.some((tenantDomain) => tenantDomain.tenantId === tenantId)
  ) {
    return;
  }

  await deleteItem({
    Key: {
      pk: `domain/${oldDomain}`,
      sk: tenantId,
    },
    TableName,
  });
};
