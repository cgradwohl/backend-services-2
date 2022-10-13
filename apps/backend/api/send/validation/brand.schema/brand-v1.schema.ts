import { noAdditionalProps } from "../helpers.schema";

const ColorsSchema = {
  type: "object",
  properties: {
    primary: { type: "string" },
    secondary: { type: "string" },
    tertiary: { type: "string" },
  },
  additionalProperties: noAdditionalProps(
    "message.brand.settings.colors (v2020-06-19)"
  ),
};

const EmailSchema = {
  type: "object",
  properties: {
    footer: { type: "object" },
    header: { type: "object" },
  },
};

const SettingsSchema = {
  type: "object",
  properties: {
    colors: ColorsSchema,
    email: EmailSchema,
  },
  additionalProperties: noAdditionalProps(
    "message.brand.settings (v2020-06-19)"
  ),
};

const SnippetsSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          format: { const: "handlebars" },
          name: { type: "string" },
          value: { type: "string" },
        },
        required: ["format", "name", "value"],
      },
    },
  },
  additionalProperties: noAdditionalProps(
    "message.brand.snippets (v2020-06-19)"
  ),
};

export const MessageBrandV1Schema = {
  type: "object",
  properties: {
    version: {
      oneOf: [{ const: "2020-06-19T18:51:36.083Z" }, { const: "2020-06-19" }],
    },
    settings: SettingsSchema,
    snippets: SnippetsSchema,
  },
  required: ["settings"],
  additionalProperties: noAdditionalProps("message.brand (v2020-06-19)"),
};
