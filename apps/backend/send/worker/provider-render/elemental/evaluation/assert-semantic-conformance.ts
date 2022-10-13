import { ElementalIR, ElementalNodeIR } from "~/api/send/types";
import { ElementalError } from "../errors";
import { ElementalRefs } from "./types";

export function assertSemanticConformance(
  ir: ElementalIR,
  refTable: ElementalRefs,
  /** Internal use only */
  startIndex = 0
): void {
  ir.forEach((element, index) => {
    const totalIndex = startIndex + index;

    // Analyze element if statement
    if ("if" in element) {
      const refIds = extractRefIdsFromString(element["if"]);

      refIds.forEach((ref) => {
        const referencedElement = checkForUseOfRefThatDoesNotExist(
          ref,
          refTable
        );
        checkForUseBeforeDefined(totalIndex, referencedElement);
      });
    }

    // Handle children
    if ("elements" in element) {
      assertSemanticConformance(element.elements, refTable, totalIndex);
    }
  });
}

/** Throws an error if ref is invalid, otherwise returns the referenced element */
export function checkForUseOfRefThatDoesNotExist(
  refId: string,
  refs: ElementalRefs
) {
  const referencedElement = refs[refId];
  if (!referencedElement) {
    throw new ElementalError(`Element with ref "${refId}" does not exist.`);
  }

  return referencedElement;
}

// Also covers circular references
export function checkForUseBeforeDefined(
  currentElementIndex: number,
  referencedElement: ElementalNodeIR
) {
  if (referencedElement.index > currentElementIndex) {
    throw new ElementalError(
      `Element references "${referencedElement.ref}" before it is defined.`
    );
  }
}

/** Returns an array of all refIds found in the string */
export function extractRefIdsFromString(str: string): string[] {
  // Scan string for refs in the format of refs.refName
  const refs = str.match(/refs\.([a-zA-Z0-9_]+)/g) ?? [];
  return refs.map((ref) => ref.slice(5));
}
