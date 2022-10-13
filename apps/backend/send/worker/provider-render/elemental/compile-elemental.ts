import { Content, MessageData, UTM } from "~/api/send/types";
import { IVariableHandler } from "~/lib/variable-handler";
import { Block, IProfile } from "~/types.api";
import { evaluateElemental } from "./evaluation";
import { getChannelOverrides } from "./get-channel-overrides";
import { renderElements } from "./render-elements";
import { getElementalContent, getTitle } from "./utils";

type ElementalContentMessageCompiler = {
  content: Content;
  channel?: string;
  locale?: string;
  profile: IProfile;
  data: MessageData;
  utm?: UTM;
  variableHandler: IVariableHandler;
};

export interface CompiledElemental {
  title: string;
  renderedBlocks: Block[];
  channelOverride?: {
    [template: string]: any;
  };
}

export function compileElementalContentMessage({
  content,
  channel,
  locale,
  profile,
  data,
  utm,
  variableHandler,
}: ElementalContentMessageCompiler): CompiledElemental {
  const ir = evaluateElemental({
    elements: getElementalContent(content).elements,
    channel,
    locale,
    data,
    utm,
    profile,
  });
  return {
    title: getTitle(ir),
    renderedBlocks: renderElements(ir),
    channelOverride: getChannelOverrides({
      elements: ir,
      channel,
      variableHandler,
    }),
  };
}
