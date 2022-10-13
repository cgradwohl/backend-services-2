import { IActionButtonStyle, IAlignment } from "~/types.api";

export interface ElementalContent {
  version: "2022-01-01";
  elements: ElementalNode[];
}

export type ElementalNode =
  | ElementalTextNode
  | ElementalMetaNode
  | ElementalChannelNode
  | ElementalImageNode
  | ElementalActionNode
  | ElementalDividerNode
  | ElementalGroupNode
  | ElementalQuoteNode
  | ElementalHtmlNode
  | ElementalCommentNode;

export interface ElementalTextNode extends ElementalBaseNode {
  type: "text";
  content: string;
  format?: "markdown";
  locales?: ElementalLocales<{
    content?: string;
  }>;
}

export interface ElementalMetaNode extends ElementalBaseNode {
  type: "meta";
  title?: string;
  locales?: ElementalLocales<{
    title?: string;
  }>;
}

export interface ElementalChannelNode extends ElementalBaseNode {
  type: "channel";
  channel: string;
  elements?: ElementalNode[];
  raw?: { [templateName: string]: any };
  locales?: ElementalLocales<{
    elements?: ElementalNode[];
    raw?: { [templateName: string]: any };
  }>;
}

export interface ElementalImageNode extends ElementalBaseNode {
  type: "image";
  src: string;
  href?: string;
  align?: IAlignment;
  alt_text?: string;
  width?: string;
  locales?: ElementalLocales<{
    href?: string;
    src?: string;
  }>;
}

export interface ElementalActionNode extends ElementalBaseNode {
  type: "action";
  content: string;
  href: string;
  action_id?: string;
  style?: IActionButtonStyle;
  align?: IAlignment;
  background_color?: string;
  locales?: ElementalLocales<{
    content?: string;
    href?: string;
  }>;
}

export interface ElementalDividerNode extends ElementalBaseNode {
  type: "divider";
  color?: string;
}

export interface ElementalGroupNode extends ElementalBaseNode {
  type: "group";
  elements: ElementalNode[];
  locales?: ElementalLocales<{
    elements?: ElementalNode[];
  }>;
}

export interface ElementalQuoteNode extends ElementalBaseNode {
  type: "quote";
  content: string;
  align?: IAlignment;
  border_color?: string;
  text_style?: "text" | "h1" | "h2" | "subtext";
  locales?: ElementalLocales<{
    content?: string;
  }>;
}

export interface ElementalHtmlNode extends ElementalBaseNode {
  type: "html";
  content: string;
  locales?: ElementalLocales<{
    content?: string;
  }>;
}

export interface ElementalCommentNode extends ElementalBaseNode {
  type: "comment";
  comment?: string;
  object?: any;
}

interface ElementalBaseNode {
  type: string;
  channels?: string[];
  ref?: string;
  if?: string;
  loop?: string;
}

export type ElementalLocales<T extends Object> = {
  [locale: string]: T;
};

export type ElementalIR = ElementalNodeIR[];

export type ElementalNodeIR =
  | WithIRMetadata<ElementalTextNode>
  | WithIRMetadata<ElementalMetaNode>
  | ElementalChannelNodeIR
  | WithIRMetadata<ElementalImageNode>
  | WithIRMetadata<ElementalActionNode>
  | WithIRMetadata<ElementalDividerNode>
  | ElementalGroupNodeIR
  | WithIRMetadata<ElementalQuoteNode>
  | WithIRMetadata<ElementalHtmlNode>;

export type ElementalChannelNodeIR = WithIRMetadata<
  WithIRElements<ElementalChannelNode>
>;

export type ElementalGroupNodeIR = WithIRMetadata<
  WithIRElements<ElementalGroupNode>
>;

type WithIRElements<T extends Object> = {
  [K in keyof T]: K extends "elements" ? ElementalIR : T[K];
};

type WithIRMetadata<T extends Object> = T & {
  index: number;
  visible: boolean;
};
