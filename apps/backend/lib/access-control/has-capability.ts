import assertHasCapability, {
  CapabilityAssertionError,
} from "./assert-has-capability";

type HasCapability = (
  role: Parameters<typeof assertHasCapability>[0],
  capability: Parameters<typeof assertHasCapability>[1],
  resource: Parameters<typeof assertHasCapability>[2]
) => boolean;

const hasCapabilty: HasCapability = (role, capability, resource) => {
  try {
    assertHasCapability(role, capability, resource);
    return true;
  } catch (err) {
    if (err instanceof CapabilityAssertionError) {
      return false;
    }
    throw err;
  }
};

export default hasCapabilty;
