import {
  MessageMetadata,
  ElementalIR,
  ElementalNode,
  MessageData,
  UTM,
} from "~/api/send/types";
import { filterChannels } from "./filter-channels";
import { filterConditionals } from "./filter-conditionals";
import { generateIR } from "./generate-ir";
import { generateRefs } from "./generate-refs";
import { evaluateLoops } from "./loop-evaluation";
import { assertSemanticConformance } from "./assert-semantic-conformance";
import { updateVisibility } from "./update-visibility";
import { pipe } from "~/lib/pipe";
import { interpolateLocales } from "./interpolate-locales";
import { applyTransformations } from "./apply-transformations";
import { IProfile } from "~/types.api";

type ElementEvaluator = {
  channel?: string;
  elements: ElementalNode[];
  locale?: string;
  data: MessageData;
  utm?: UTM;
  profile: IProfile;
};

/**
 * Evaluates the control flow of the elements and produces an IR with channels and failed
 * conditionals filtered out. It also renders the looped elements
 */
export function evaluateElemental({
  elements,
  channel,
  data,
  locale,
  utm,
  profile,
}: ElementEvaluator): ElementalIR {
  const ir = generateIR(elements);
  const refs = generateRefs(ir);
  assertSemanticConformance(ir, refs);

  return pipe(ir)
    .into((ir) => filterChannels({ ir, channel }))
    .into((ir) => updateVisibility(ir, refs))
    .into((ir) => filterConditionals({ ir, data, profile, refs }))
    .into((ir) => interpolateLocales({ ir, locale }))
    .into((ir) => evaluateLoops({ ir, data, profile, refs }))
    .into((ir) => applyTransformations({ ir, data, profile, utm }))
    .complete();
}
