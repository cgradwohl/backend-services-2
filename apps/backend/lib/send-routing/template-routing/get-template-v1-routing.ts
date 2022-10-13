import { getChannelPreferences } from "~/lib/preferences";
import { TokensByProvider } from "~/lib/token-storage";
import createVariableHandler from "~/lib/variable-handler";
import { IProviderConfiguration, ISendMessageContext } from "~/send/types";
import { INotificationWire, NotificationCategory } from "~/types.api";
import { IProfilePreferences } from "~/types.public";
import { RouteNode } from "../types";
import { templateRouter } from "./template-router";
import { templateV1RoutingSummaryToTree } from "./template-routing-summary-to-tree";
import { TemplateV1RoutingSummary } from "./types";

export const generateTemplateV1Routing = async (opts: {
  category?: NotificationCategory;
  templateV1: INotificationWire;
  preferences?: Partial<IProfilePreferences>;
  providers: IProviderConfiguration[];
  variableData: ISendMessageContext["variableData"];
  tokens?: TokensByProvider;
}): Promise<RouteNode> => {
  const summary = await getTemplateV1RoutingSummary({
    ...opts,
    allowMultipleChannels: true,
  });
  return templateV1RoutingSummaryToTree(summary);
};

/* Gives the user the ability to get consolidated routing summary from a notification template defined in studio. */
export async function getTemplateV1RoutingSummary({
  variableData,
  templateV1,
  category,
  preferences,
  providers,
  tokens,
  allowMultipleChannels,
}: {
  category?: NotificationCategory;
  templateV1: INotificationWire;
  preferences?: Partial<IProfilePreferences>;
  providers: IProviderConfiguration[];
  variableData: ISendMessageContext["variableData"];
  tokens?: TokensByProvider;
  allowMultipleChannels?: boolean; // Hack for failover
}): Promise<TemplateV1RoutingSummary> {
  const alwaysChannels = templateV1.json?.channels?.always?.length
    ? getChannelPreferences(
        category!,
        templateV1,
        preferences!,
        templateV1.json?.channels?.always
      )
    : [];

  const bestOfChannels = templateV1.json?.channels?.bestOf?.length
    ? getChannelPreferences(
        category!,
        templateV1,
        preferences!,
        templateV1.json?.channels?.bestOf
      )
    : [];

  const variableHandler = createVariableHandler({ value: variableData });

  const providersById = providers.reduce(
    (acc, config) => ({
      ...acc,
      [config.id]: config,
    }),
    {}
  );

  // [HACK]: this is to get iterate over the always channels to get consolidated routing summary
  const summary = {
    always: await Promise.all(
      alwaysChannels.map(async (alwaysChannel) => {
        const [result] = await templateRouter(
          [alwaysChannel],
          templateV1.id,
          providersById,
          variableHandler,
          tokens
        );
        return result;
      })
    ),
    bestOf: await templateRouter(
      bestOfChannels,
      templateV1.id,
      providersById,
      variableHandler,
      tokens,
      allowMultipleChannels
    ),
  };

  return {
    always: summary.always.filter((channel) => !!channel),
    bestOf: summary.bestOf.filter((channel) => !!channel),
  };
}
