import { VM } from "vm2";
import { ElementalIR, ElementalNodeIR, MessageData } from "~/api/send/types";
import { ElementalError } from "../errors";
import { ElementalRefs } from "./types";
import handlebars from "handlebars";
import addHelper from "~/handlebars/helpers/universal/math/add";
import subHelper from "~/handlebars/helpers/universal/math/subtract";
import divHelper from "~/handlebars/helpers/universal/math/divide";
import mulHelper from "~/handlebars/helpers/universal/math/multiply";
import absHelper from "~/handlebars/helpers/universal/math/abs";
import ceilHelper from "~/handlebars/helpers/universal/math/ceil";
import modHelper from "~/handlebars/helpers/universal/math/mod";
import roundHelper from "~/handlebars/helpers/universal/math/round";
import floorHelper from "~/handlebars/helpers/universal/math/floor";
import {
  elementHasHbsSupportedField,
  evaluateHbsOfElement,
} from "./evaluate-hbs";
import { IProfile } from "~/types.api";

handlebars.registerHelper("add", addHelper);
handlebars.registerHelper("subtract", subHelper);
handlebars.registerHelper("divide", divHelper);
handlebars.registerHelper("multiply", mulHelper);
handlebars.registerHelper("abs", absHelper);
handlebars.registerHelper("ceil", ceilHelper);
handlebars.registerHelper("mod", modHelper);
handlebars.registerHelper("round", roundHelper);
handlebars.registerHelper("floor", floorHelper);

export interface EvaluateLoopsOpts {
  ir: ElementalIR;
  refs: ElementalRefs;
  data: MessageData;
  profile: IProfile;
  $?: LoopContext;
}

/**
 * Expands loops into multiple IR elements.
 *
 * Note: This function does not update element indexes. Therefore, this function
 * should be called after all other element evaluation.
 */
export function evaluateLoops(opts: EvaluateLoopsOpts): ElementalIR {
  const { ir, refs, data, profile, $ } = opts;
  return ir.flatMap((element) => {
    const loop = element.loop;

    // If $ exists this is a recursive call
    if (!loop && $ && elementHasHbsSupportedField(element)) {
      return evaluateHbsOfElement(element, { refs, data, profile, $ });
    }

    // Be sure to render group elements as well, even if the group itself is not looped.
    if (!loop && "elements" in element) {
      return {
        ...element,
        elements: evaluateLoops({ ...opts, ir: element.elements }),
      };
    }

    if (!loop) {
      return element;
    }

    const loopResult = evaluateLoop({ data, refs, loop, profile, $ });
    return loopResult.flatMap<ElementalNodeIR>((item, index) => {
      const $ = { item, index };
      const copy = { ...element };
      delete copy.loop;
      return evaluateLoops({ ...opts, ir: [copy], $ });
    });
  });
}

export function evaluateLoop({
  loop,
  refs,
  data,
  profile,
  $,
}: {
  refs: ElementalRefs;
  data: any;
  loop: string;
  profile: IProfile;
  $?: LoopContext;
}): ElementalIR {
  const vm = new VM({ sandbox: { data, refs, profile, $ } });
  const loopResult = vm.run(loop);
  assertIsValidLoopResult(loopResult);
  return loopResult;
}

export function assertIsValidLoopResult(
  loopResult: unknown
): asserts loopResult is any[] {
  if (!Array.isArray(loopResult)) {
    throw new ElementalError("A loop expression must evaluate to an array.");
  }
}

type LoopContext = {
  index: number;
  item: any;
};
