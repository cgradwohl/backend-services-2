import { ElementalIR } from "~/api/send/types";
import { ElementalError } from "../errors";
import { ElementalRefs } from "./types";

export function generateRefs(elements: ElementalIR): ElementalRefs {
  return elements.reduce((refs, element) => {
    const ref = element.ref;

    if (ref && refs[ref]) {
      throw new ElementalError(`Duplicate ref ${ref}`);
    }

    if (ref) {
      return {
        ...refs,
        [ref]: element,
      };
    }

    if ("elements" in element) {
      return {
        ...refs,
        ...generateRefs(element.elements),
      };
    }

    return refs;
  }, {});
}
