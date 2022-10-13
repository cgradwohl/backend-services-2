import { ElementalIR, ElementalNodeIR } from "~/api/send/types";
import { ElementalRefs } from "./types";

/**
 * Checks the ref table for refs that are no longer in the IR.
 * If they are not, ref.visible is set to false.
 *
 * @returns the original ir for convenience.
 */
export function updateVisibility(
  ir: ElementalIR,
  refs: ElementalRefs
): ElementalIR {
  Object.keys(refs).forEach((refId) => {
    const ref = refs[refId];
    ref.visible = ir.some((element) => elementIsRef(element, refId));
  });
  return ir;
}

/** returns true if the passed element either is the ref or contains it */
export function elementIsRef(element: ElementalNodeIR, refId: string): boolean {
  if (element.ref === refId) {
    return true;
  }

  if ("elements" in element) {
    return element.elements.some((element) => elementIsRef(element, refId));
  }

  return false;
}
