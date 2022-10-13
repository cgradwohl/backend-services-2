import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Operation } from "fast-json-patch";
import { IPublishableObject } from "../dynamo/object-service/types";

export type BrandCourierObject = IPublishableObject<ICourierObjectJson>;

export type CreateFn = (
  tenantId: string,
  creator: string,
  brand: ICreatableBrand,
  options?: { publish?: boolean }
) => Promise<IBrand>;

export type CreateDefaultBrandFn = (
  tenantId: string,
  creator: string,
  id?: string
) => Promise<IBrand>;

export type DeleteFn = (tenantId: string, id: string) => Promise<void>;

export interface IGetFnOptions {
  extendDefaultBrand?: boolean;
}
export type GetFn = (
  tenantId: string,
  id: string,
  options?: IGetFnOptions
) => Promise<IBrand>;
export type GetDefaultFn = (tenantId: string) => Promise<IBrand>;
export type GetLatestFn = (tenantId: string, id: string) => Promise<IBrand>;
export type GetLatestDefaultFn = (tenantId: string) => Promise<IBrand>;

export type GetVersionFn = (
  tenantId: string,
  id: string,
  version: string
) => Promise<IBrand>;

export interface IBrand {
  created: number;
  creator: string;
  defaultBrand?: boolean;
  id: string;
  name: string;
  published?: number;
  settings: IBrandSettings;
  snippets?: IBrandSnippets;
  updated: number;
  updater: string;
  version: string;
}

export interface IBrandColors {
  // CSS compliant color value
  primary?: string;
  secondary?: string;
  tertiary?: string;
}

export interface IBrandSettings {
  colors?: IBrandColors;
  email?: IBrandSettingsEmail;
  inapp?: IBrandSettingsInApp;
}

interface IBrandTemplate {
  backgroundColor?: string;
  blocksBackgroundColor?: string;
  enabled: boolean;
  footer?: string;
  head?: string;
  header?: string;
  width?: string;
}

export interface IBrandTemplateOverride extends IBrandTemplate {
  mjml?: IBrandTemplate;
  footerBackgroundColor?: string;
  footerFullWidth?: boolean;
}

export interface IBrandSettingsEmail {
  templateOverride?: IBrandTemplateOverride;
  head?: {
    inheritDefault: boolean;
    content?: string;
  };
  footer?: {
    content?: object;
    inheritDefault?: boolean;
    markdown?: string;
    social?: IBrandSettingsSocialPresence;
  };
  header?: {
    inheritDefault?: boolean;
    barColor?: string;
    logo?: {
      href?: string;
      image?: string;
    };
  };
}
export interface IBrandSettingsInApp {
  borderRadius?: string;
  disableMessageIcon?: boolean;
  fontFamily?: string;
  placement?: "top" | "bottom" | "left" | "right";
  emptyState?: {
    textColor?: string;
    text?: string;
  };
  widgetBackground?: {
    topColor?: string;
    bottomColor?: string;
  };
  colors?: {
    invertHeader?: boolean;
    invertButtons?: boolean;
  };
  icons?: {
    bell?: string;
    message?: string;
  };
  preferences?: {
    templateIds: string[];
  };
}

export interface IBrandSettingsSocialPresence {
  inheritDefault?: boolean;
  facebook?: {
    url: string;
  };
  instagram?: {
    url: string;
  };
  linkedin?: {
    url: string;
  };
  medium?: {
    url: string;
  };
  twitter?: {
    url: string;
  };
}

export interface IBrandSnippet {
  format: "handlebars"; // could support other formats in the future
  name: string;
  value: string;
}
export interface IBrandSnippets {
  items: IBrandSnippet[];
}

export interface ICourierObjectJson {
  settings?: IBrandSettings;
  snippets?: IBrandSnippets;
}

export interface ICreatableBrand {
  id?: string;
  name: string;
  settings: IBrandSettings;
  snippets?: IBrandSnippets;
}
export interface IReplaceableBrand {
  name: string;
  settings: IBrandSettings;
}

export type ListFn = (
  tenantId: string,
  exclusiveStartKey?: DocumentClient.Key
) => Promise<{
  items: IBrand[];
  lastEvaluatedKey?: DocumentClient.Key;
}>;

export type ListVersionsFn = (
  tenantId: string,
  id: string
) => Promise<{
  items: IBrand[];
  lastEvaluatedKey: DocumentClient.Key;
}>;

export type PatchFn = (
  tenantId: string,
  brandId: string,
  updater: string,
  ops: Operation[]
) => Promise<IBrand>;

export type ReplaceFn = (
  tenantId: string,
  userId: string,
  id: string,
  brand: IReplaceableBrand,
  options?: { publish?: boolean }
) => Promise<IBrand>;
