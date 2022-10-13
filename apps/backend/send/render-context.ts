import { ISendMessageContext } from "./types";
import { getRenderedTemplates } from "./worker/provider-render/get-rendered-templates";

export const renderContext = async (
  context: ISendMessageContext,
  {
    channel,
    provider,
    locale,
  }: {
    channel: string;
    provider: string;
    locale: string;
  }
) => {
  const providerConfig = context.providers.find((p) => {
    return p.json.provider === provider;
  });

  const result = await getRenderedTemplates(context, {
    brand: context.brands.main,
    channel,
    channelRendered: undefined,
    locale,
    providerConfig,
  });

  return result;
};
