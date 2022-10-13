// pk = publish key
// dk = draft key
// sk = submitted key
// prod = production env
// test = test env
export const publishedProductionScope = "published/production";

// a few tenants get these in addition to default ones
const additionalScopes: ReadonlyMap<string, string> = new Map([
  ["submitted/production", "sk_prod_"],
  ["submitted/test", "sk_test_"],
]);

// all tenants get these by default
const defaultScopes: ReadonlyMap<string, string> = new Map([
  [publishedProductionScope, "pk_prod_"],
  ["draft/production", "dk_prod_"],
  ["published/test", "pk_test_"],
  ["draft/test", "dk_test_"],
]);

export { additionalScopes, defaultScopes };
