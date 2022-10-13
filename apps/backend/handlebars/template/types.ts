import { IBrandSettingsEmail } from "~/lib/brands/types";
import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import {
  EmailJsonParams,
  IChannelProviderConfiguration,
  IPushConfig,
  IProfile,
  IChannel,
} from "~/types.api";

export interface ITemplateHandlerReturnTypes {
  discord: string;
  elemental: object[];
  email: string;
  inApp: object[] | undefined;
  markdown: string;
  msteams: string | string[] | undefined;
  plain: string;
  slack: object[] | undefined;
  text: string | undefined;
  webhook: object | undefined;
}

export type TemplateHandlerType = keyof ITemplateHandlerReturnTypes;

export interface ITemplateHandler<T extends keyof ITemplateHandlerReturnTypes> {
  type: T;
  render: (
    variableHandler: IVariableHandler,
    linkHandler: ILinkHandler,
    data?: Record<string, unknown>
  ) => ITemplateHandlerReturnTypes[T];
}

export type TemplateHandler = {
  [K in TemplateHandlerType]: ITemplateHandler<K>;
}[TemplateHandlerType];

export type TemplateConfig = IChannelProviderConfiguration & {
  channel?: string;
  brand?: {
    enabled?: boolean;
    email?: IBrandSettingsEmail;
  };
  email?: EmailJsonParams;
  locale?: string;
  partials?: { [partial: string]: string };
  push?: IPushConfig;
  slots?: IChannel["slots"];
  tenantId?: string;
};
