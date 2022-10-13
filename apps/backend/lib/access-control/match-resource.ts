const WILDCARD = "*";

const matchResource = (resources: string[], requested: string) => {
  for (const resource of resources) {
    // if it is a root-level wildcard or an exact match then
    // short-circuit processing and return true
    if (resource === "*" || resource === requested) {
      return true;
    }

    const resourceSegments = resource.split("");

    // loop through each character of the resource and check for equality
    // with the same position in the requested resource. this allows
    // for arbitrarily structured id elements.
    for (const [index, segment] of resourceSegments.entries()) {
      if (segment !== WILDCARD && segment !== requested[index]) {
        return false;
      }

      // if the segment is a wildcard
      // and that wildcard is not the first character, it will treat it as a match
      if (index > 0 && segment === WILDCARD) {
        return true;
      }
    }
  }
  return false;
};

export default matchResource;
