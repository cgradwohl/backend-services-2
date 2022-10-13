import { VM } from "vm2";
import { ElementalIR, ElementalNodeIR, MessageData } from "~/api/send/types";
import { IProfile } from "~/types.api";
import { ElementalError } from "../errors";
import { ElementalRefs } from "./types";

export interface FilterConditionalsOpts {
  ir: ElementalIR;
  data: MessageData;
  refs: ElementalRefs;
  profile: IProfile;
}

/**
 * Filters out elements that fail their conditional check.
 *
 * Note. Unlike filterChannels, filterConditionals updates the visible property
 * of the element on the ref table.
 */
export function filterConditionals({
  ir,
  data,
  refs,
  profile,
}: FilterConditionalsOpts): ElementalIR {
  const vm = new VM({ sandbox: { data, refs, profile } });
  return runConditionalEvaluation(ir, vm);
}

function runConditionalEvaluation(ir: ElementalIR, vm: VM): ElementalIR {
  return ir
    .filter((element) => {
      if (!element["if"]) {
        return true;
      }

      const ifResult = vm.run(element["if"]);
      if (typeof ifResult !== "boolean") {
        throw new ElementalError(
          "A conditional expression must evaluate to a boolean."
        );
      }

      markElementVisibility(element, ifResult, vm.sandbox.refs);
      return ifResult;
    })
    .map((element) => {
      if ("elements" in element) {
        return {
          ...element,
          elements: runConditionalEvaluation(element.elements, vm),
        };
      }

      return element;
    });
}

function markElementVisibility(
  element: ElementalNodeIR,
  visible: boolean,
  refs: ElementalRefs
) {
  if (visible) {
    return;
  }

  const refElement = refs[element.ref];
  if (refElement) {
    refElement.visible = false;
  }
}
