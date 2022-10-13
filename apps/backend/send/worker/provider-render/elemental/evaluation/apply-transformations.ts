import {
  ElementalIR,
  ElementalNodeIR,
  MessageData,
  UTM,
} from "~/api/send/types";
import { pipe } from "~/lib/pipe";
import { evaluateHbsOfElement } from "./evaluate-hbs";
import { addUtmToElementalHref } from "../../augment-href";
import DOMPurify from "isomorphic-dompurify";
import { IProfile } from "~/types.api";

export function applyTransformations(opts: {
  ir: ElementalIR;
  data: any;
  profile: IProfile;
  utm?: UTM;
}): ElementalIR {
  const { ir, ...context } = opts;
  return ir.map((element) => {
    const evaluated = applyFieldTransformations({ element, ...context });

    if ("elements" in evaluated) {
      evaluated.elements = applyTransformations({
        ir: evaluated.elements,
        ...context,
      });
    }

    return evaluated;
  });
}

export function applyFieldTransformations({
  element,
  data,
  profile,
  utm,
}: {
  element: ElementalNodeIR;
  data: MessageData;
  profile: IProfile;
  utm?: UTM;
}): ElementalNodeIR {
  return pipe(element)
    .into((element) => evaluateHbsOfElement(element, { profile, ...data }))
    .into((element) => addUtmToElementalHref(element, utm))
    .into(transformHtml)
    .complete();
}

export function transformHtml(element: ElementalNodeIR): ElementalNodeIR {
  if (element.type !== "html") {
    return element;
  }

  return {
    ...element,
    content: DOMPurify.sanitize(element.content, { FORCE_BODY: true }),
  };
}
