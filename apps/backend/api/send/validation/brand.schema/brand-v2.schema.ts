import { noAdditionalProps } from "../helpers.schema";

const BrandColorsSchema = {
  type: "object",
  properties: {
    primary: { type: "string" },
    secondary: { type: "string" },
    tertiary: { type: "string" },
  },
};

const BrandLogoSchema = {
  type: "object",
  properties: {
    href: { type: "string" },
    image: { type: "string" },
  },
  required: ["image"],
  additionalProperties: noAdditionalProps("message.brand.logo (v2022-05-17)"),
};

const BrandLocalesSchema = {
  type: "object",
  additionalProperties: {
    type: "object",
    properties: {
      colors: BrandColorsSchema,
      logo: BrandLogoSchema,
    },
  },
};

export const MessageBrandV2Schema = {
  type: "object",
  properties: {
    version: { const: "2022-05-17" },
    colors: BrandColorsSchema,
    logo: BrandLogoSchema,
    locales: BrandLocalesSchema,
  },
  required: ["version"],
  additionalProperties: noAdditionalProps("message.brand (v2022-05-17)"),
};
