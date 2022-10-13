import { ElementalNodeIR, ElementalNode, ElementalIR } from "~/api/send/types";
import { ElementalRefs } from "./types";

/** Fills out the metadata of an element and returns the refTable. Please suggest a better name. */
export function generateIR(
  elements: ElementalNode[],
  refs: ElementalRefs = {},
  startIndex = 0
): ElementalIR {
  return elements
    .filter((element) => element.type !== "comment")
    .map((element, index) => {
      const totalIndex = startIndex + index;
      return {
        ...element,
        index: totalIndex,
        visible: true,
        ...("elements" in element
          ? { elements: generateIR(element.elements, refs, totalIndex + 1) }
          : undefined),
      } as ElementalNodeIR;
    });
}
