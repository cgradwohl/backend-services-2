import courierHandlebarsPartials from ".";
import compilePartialsObject from "./compile-partials-object";

/*
  this is a temporary file that will be used to transition customers
  off existing templates that contain code snippets prior to brands
  supporting dynamic code snippets
*/

const tempPartialsTenants = {
  lattice: [
    "f81d6ef0-260e-44a1-9138-e1ab46e56dde", // lattice
    "ce79b74a-caad-451c-9bd3-0fd95a2d4ea8", // courier production
    "c8fa99b7-d0d8-4225-8825-5ef259542665", // prod qa
    "afbeeb4b-2021-4380-9dd5-eb4cc37106c0", // staging shared
    "a2cd15a1-95a3-4d15-95ba-dbce82fa6335", // danny local
  ],
  launchdarkly: [
    "5c5ed4a7-b3b2-4b28-94a4-7eba76292899", // launch darkly
    "242921ac-fa80-4332-845c-892b6b59ad3d", // launch darkly staging
    "1371c707-c0d2-468f-be72-a89cb2d127c1", // launch darkly development
    "ce79b74a-caad-451c-9bd3-0fd95a2d4ea8", // courier production
    "c8fa99b7-d0d8-4225-8825-5ef259542665", // prod qa
    "afbeeb4b-2021-4380-9dd5-eb4cc37106c0", // staging shared
    "a2cd15a1-95a3-4d15-95ba-dbce82fa6335", // danny local
    "118c6491-a35d-4b81-b10b-d22f7d20da0c", // josh local
  ],
};

export const getRawTenantPartials = (tenantId: string) => {
  if (tempPartialsTenants.launchdarkly.includes(tenantId)) {
    return courierHandlebarsPartials.tenants.launchdarkly;
  }
  return null;
};

export default (tenantId: string) => {
  const partials = getRawTenantPartials(tenantId);

  if (!partials) {
    return null;
  }

  return compilePartialsObject(partials);
};
