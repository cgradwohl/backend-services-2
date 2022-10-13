import { colorPattern, noAdditionalProps, sizePattern } from "./helpers.schema";

const commonProps = {
  locales: { type: "object" },
  if: { type: "string" },
  loop: { type: "string" },
  ref: { type: "string" },
  channels: {
    type: "array",
    items: { type: "string" },
  },
};

export const ActionElement = {
  type: "object",
  properties: {
    type: { const: "action" },
    content: { type: "string" },
    href: { type: "string" },
    action_id: { type: "string" },
    align: { enum: ["center", "left", "right", "full"] },
    background_color: { type: "string", pattern: colorPattern },
    style: { enum: ["button", "link"] },
    ...commonProps,
  },
  required: ["type", "content", "href"],
  additionalProperties: noAdditionalProps("'action' type element"),
  errorMessage: {
    required:
      "Invalid Request. ${0#} property is required for element of type 'action'",
  },
};

export const CommentElement = {
  type: "object",
  properties: {
    type: { const: "comment" },
    comment: { type: "string" },
    object: { type: "object" },
    ...commonProps,
  },
  required: ["type", "content", "href"],
  additionalProperties: noAdditionalProps("'comment' type element"),
  errorMessage: {
    required:
      "Invalid Request. ${0#} property is required for element of type 'comment'",
  },
};

export const DividerElement = {
  type: "object",
  properties: {
    type: { const: "divider" },
    color: { type: "string", pattern: colorPattern },
    ...commonProps,
  },
  required: ["type"],
  additionalProperties: noAdditionalProps("'divider' type element"),
  errorMessage: {
    required:
      "Invalid Request. ${0#} property is required for element of type 'divider'",
  },
};

export const ImageElement = {
  type: "object",
  properties: {
    type: { const: "image" },
    src: { type: "string" },
    align: { type: "string" },
    alt_text: { type: "string" },
    href: { type: "string" },
    width: { type: "string", pattern: sizePattern },
    ...commonProps,
  },
  required: ["type", "src"],
  additionalProperties: noAdditionalProps("'image' type element"),
  errorMessage: {
    required:
      "Invalid Request. ${0#} property is required for element of type 'image'",
  },
};

export const MetaElement = {
  type: "object",
  properties: {
    type: { const: "meta" },
    title: { type: "string" },
    ...commonProps,
  },
  required: ["type"],
  additionalProperties: noAdditionalProps("'meta' type element"),
  errorMessage: {
    required:
      "Invalid Request. ${0#} property is required for element of type 'meta'",
  },
};

export const QuoteElement = {
  type: "object",
  properties: {
    type: { const: "quote" },
    content: { type: "string" },
    align: { type: "string" },
    border_color: { type: "string", pattern: colorPattern },
    text_style: { enum: ["text", "h1", "h2", "subtext"] },
    ...commonProps,
  },
  required: ["type", "content"],
  additionalProperties: noAdditionalProps("'quote' type element"),
  errorMessage: {
    required:
      "Invalid Request. ${0#} property is required for element of type 'quote'",
  },
};

export const TextElement = {
  type: "object",
  properties: {
    type: { const: "text" },
    content: { type: "string" },
    ...commonProps,
  },
  required: ["type", "content"],
  additionalProperties: noAdditionalProps("'text' type element"),
  errorMessage: {
    required:
      "Invalid Request. ${0#} property is required for element of type 'text'",
  },
};

export const HtmlElement = {
  type: "object",
  properties: {
    type: { const: "html" },
    content: { type: "string" },
    ...commonProps,
  },
  required: ["type", "content"],
  additionalProperties: noAdditionalProps("'html' type element"),
  errorMessage: {
    required:
      "Invalid Request. ${0#} property is required for element of type 'text'",
  },
};

export const GroupElement = {
  type: "object",
  properties: {
    type: { const: "group" },
    ...commonProps,
    elements: {
      type: "array",
      minItems: 1,
      items: {
        oneOf: [
          ActionElement,
          DividerElement,
          ImageElement,
          MetaElement,
          QuoteElement,
          TextElement,
          HtmlElement,
          { $ref: "#" },
          CommentElement,
        ],
      },
    },
  },
  required: ["type", "elements"],
  additionalProperties: noAdditionalProps("'group' type element"),
  errorMessage: {
    required:
      "Invalid Request. ${0#} property is required for element of type 'group'",
  },
};

export const ChannelElement = {
  type: "object",
  properties: {
    type: { const: "channel" },
    channel: { type: "string" },
    ...commonProps,
    elements: {
      type: "array",
      minItems: 1,
      items: {
        oneOf: [
          ActionElement,
          DividerElement,
          GroupElement,
          ImageElement,
          MetaElement,
          QuoteElement,
          TextElement,
          CommentElement,
        ],
      },
    },
    raw: { type: "object" },
  },
  oneOf: [
    {
      required: ["channel", "elements"],
      errorMessage: {
        required:
          "Invalid Request. Elements of type 'channel' must have property 'channel' and either 'element' or 'raw'",
      },
    },
    {
      required: ["channel", "raw"],
      errorMessage: {
        required:
          "Invalid Request. Elements of type 'channel' must have property 'channel' and either 'element' or 'raw'",
      },
    },
  ],
  additionalProperties: noAdditionalProps("'channel' type element"),
};
