type UrlParamsHandler = (
  domainName?: string,
  slug?: string
) => { slug: string; tenantId: string };

const getTenantId = (fullTenantId: string) => {
  return fullTenantId?.replace("-test", "/test");
};

const tenantIdFromDomainName = (domainName: string) => {
  const cttDomain = process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME;
  // Ex: (.*)\.ct0\.app$
  const encodedDomainName = cttDomain.split(".").join("\\.");
  const regex = new RegExp(`(.*)\\.${encodedDomainName}$`);

  const fullTenantId = (domainName.match(regex) ?? [])[1];

  return getTenantId(fullTenantId);
};

// if ctt domain, get the tenantId from the subdomain
// Ex: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.ct0.app/r/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
const getUrlParametersFromDomain: UrlParamsHandler = (domainName, slug) => ({
  slug,
  tenantId: tenantIdFromDomainName(domainName),
});

// no ctt domain so get the tenantId from the redirectParam
// Ex: /r/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
const getUrlParametersFromPath: UrlParamsHandler = (domainName, path) => {
  const slugParts = path.split(".");
  const [fullTenantId, slug] =
    slugParts.length > 1
      ? [slugParts[0], slugParts.slice(1).join(".")]
      : [undefined, slugParts[0]];

  return {
    slug,
    tenantId: getTenantId(fullTenantId),
  };
};

// Ex: domainName = tenantId.my-website.example
// slug = /r/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
const getUrlParametersFromCustomDomain = (domainName: string, slug: string) => {
  const [fullTenantId] = domainName.split(".");
  return {
    slug,
    tenantId: getTenantId(fullTenantId),
  };
};

const getUrlParameters: UrlParamsHandler = (domainName = "", slug = "") => {
  const defaultCttDomain = process.env.CLICK_THROUGH_TRACKING_DOMAIN_NAME;
  return defaultCttDomain
    ? domainName.includes(defaultCttDomain)
      ? getUrlParametersFromDomain(domainName, slug)
      : getUrlParametersFromCustomDomain(domainName, slug)
    : getUrlParametersFromPath(domainName, slug);
};

export default getUrlParameters;
