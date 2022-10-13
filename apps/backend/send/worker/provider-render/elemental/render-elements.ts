import { Value } from "slate";
import SlateMdSerializer from "slate-md-serializer";
import {
  ElementalActionNode,
  ElementalDividerNode,
  ElementalHtmlNode,
  ElementalImageNode,
  ElementalIR,
  ElementalQuoteNode,
  ElementalTextNode,
} from "~/api/send/types";
import { assertIsNever } from "~/lib/assertions/is-never";
import hydrateBlock from "~/lib/blocks/hydrate-slate-block";
import { createMd5Hash } from "~/lib/crypto-helpers";
import {
  Block,
  BlockWire,
  IActionBlockConfig,
  IDividerBlockConfig,
  IImageBlockConfig,
  IQuoteBlockConfig,
  ITemplateBlockConfig,
  ITextBlockConfig,
} from "~/types.api";
import { ElementalError } from "./errors";
const slateMdSerializer = new SlateMdSerializer();

export function renderElements(elements: ElementalIR): Block[] {
  return elementsToBlockWires(elements).map(hydrateBlock);
}

export function elementsToBlockWires(elements: ElementalIR): BlockWire[] {
  return elements
    .flatMap((element) => {
      switch (element.type) {
        case "text":
          return elementalTextNodeToBlockWire(element);
        case "html":
          return elementalHtmlNodeToBlockWire(element);
        case "image":
          return elementalImageNodeToBlockWire(element);
        case "action":
          return elementalActionNodeToBlockWire(element);
        case "divider":
          return elementalDividerNodeToBlockWire(element);
        case "quote":
          return elementalQuoteNodeToBlockWire(element);
        case "group":
          return elementsToBlockWires(element.elements);
        case "channel":
          return elementsToBlockWires(element.elements ?? []);
        case "meta":
          return undefined;
        default:
          assertIsNever(
            element,
            new ElementalError(`Invalid element type ${(element as any).type}`)
          );
      }
    })
    .filter((block) => block !== undefined);
}

export function elementalTextNodeToBlockWire(
  element: ElementalTextNode
): BlockWire {
  const value: Value = slateMdSerializer.deserialize(element.content ?? "");
  const blockConfig: ITextBlockConfig = { value };

  const blockId = `adhoc-text-${createMd5Hash(JSON.stringify(element))}`;
  return {
    id: blockId,
    type: "text",
    config: JSON.stringify(blockConfig),
  };
}

export function elementalHtmlNodeToBlockWire(
  element: ElementalHtmlNode
): BlockWire {
  const blockConfig: ITemplateBlockConfig = { template: element.content };

  const blockId = `adhoc-html-${createMd5Hash(JSON.stringify(element))}`;
  return {
    id: blockId,
    type: "template",
    config: JSON.stringify(blockConfig),
  };
}

export function elementalImageNodeToBlockWire(
  element: ElementalImageNode
): BlockWire {
  const blockConfig: IImageBlockConfig = {
    imageHref: element.href,
    imagePath: element.src,
    altText: element.alt_text,
    align: element.align,
    width: element.width,
  };

  const blockId = `adhoc-image-${createMd5Hash(JSON.stringify(element))}`;
  return {
    id: blockId,
    type: "image",
    config: JSON.stringify(blockConfig),
  };
}

export function elementalActionNodeToBlockWire(
  element: ElementalActionNode
): BlockWire {
  const blockConfig: IActionBlockConfig = {
    text: element.content,
    href: element.href,
    actionId: element.action_id,
    style: element.style ?? "button",
    align: element.align ?? "center",
    backgroundColor: element.background_color ?? "{brand.colors.primary}",
  };

  const blockId = `adhoc-action-${createMd5Hash(JSON.stringify(element))}`;
  return {
    id: blockId,
    type: "action",
    config: JSON.stringify(blockConfig),
  };
}

export function elementalDividerNodeToBlockWire(
  element: ElementalDividerNode
): BlockWire {
  const blockConfig: IDividerBlockConfig = {
    dividerColor: element.color,
  };

  return {
    id: `adhoc-divider-${createMd5Hash(JSON.stringify(element))}`,
    type: "divider",
    config: JSON.stringify(blockConfig),
  };
}

export function elementalQuoteNodeToBlockWire(
  element: ElementalQuoteNode
): BlockWire {
  const blockConfig: IQuoteBlockConfig = {
    value: slateMdSerializer.deserialize(element.content ?? ""),
    borderColor: element.border_color,
    align: element.align,
    textStyle: element.text_style,
  };

  return {
    id: `adhoc-quote-${createMd5Hash(JSON.stringify(element))}`,
    type: "quote",
    config: JSON.stringify(blockConfig),
  };
}
