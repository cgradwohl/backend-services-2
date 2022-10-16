import { Message, UserRecipient } from "~/api/send/types";
import {
  generateRouting,
  generateTemplateV1Routing,
  RouteNode,
  RoutingStrategy,
} from "~/lib/send-routing";
import { TokensByProvider } from "~/lib/token-storage";
import { IProviderConfiguration, ISendMessageContext } from "~/send/types";
import { INotificationWire, IProfile, NotificationCategory } from "~/types.api";
import { IProfilePreferences } from "~/types.public";
import { getUserRouting } from "./get-custom-routing-strategy";

export interface GetRoutingTreeOpts {
  message: Message;
  tenantId: string;
  templateV1?: INotificationWire;
  profile: IProfile;
  tokens?: TokensByProvider;
  providerConfigs: IProviderConfiguration[];
  strategy: RoutingStrategy;

  // Template V1 stuff
  category?: NotificationCategory;
  preferences?: Partial<IProfilePreferences>;
  variableData: ISendMessageContext["variableData"];
}

/** To maintain backwards compatibility with pending calls the result of this function is intended to be spread onto ISendMessageContext */
export const getRoutingTree = async (
  opts: GetRoutingTreeOpts
): Promise<RoutingContext> => {
  const { tenantId, templateV1 } = opts;

  const userRouting = await getUserRouting({
    userId: (opts.message.to as UserRecipient)?.user_id,
    tenantId,
    preferenceTemplateId: opts.templateV1?.json?.preferenceTemplateId,
  });

  const routingOverride = userRouting ?? opts.message.routing;

  if (templateV1 && !routingOverride) {
    return {
      routingTree: await generateTemplateV1Routing({
        category: opts.category,
        templateV1,
        preferences: opts.preferences,
        variableData: opts.variableData,
        tokens: opts.tokens,
        providers: opts.providerConfigs,
      }),
    };
  }

  const strategy = {
    ...opts.strategy,
    routing: routingOverride ?? opts.strategy.routing,
  };

  return {
    routingTree: await generateRouting({
      providerConfigs: opts.providerConfigs,
      templateV1: opts.templateV1,
      tokens: opts.tokens,
      params: { profile: opts.profile, data: opts.message.data },
      strategy,
    }),
  };
};

export interface RoutingContext {
  routingTree: RouteNode;
}
