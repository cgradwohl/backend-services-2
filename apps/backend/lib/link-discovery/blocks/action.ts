import { IActionBlockConfig } from "~/types.api";
import { IBlockComponentLinkDiscoveryHandler } from ".";

const actionBlockComponentLinkDiscovery: IBlockComponentLinkDiscoveryHandler = (
  block,
  serializerType
) => {
  const { config: blockConfig, links, scope } = block;
  const actionBlockConfig = blockConfig as IActionBlockConfig;
  const { href, style, useWebhook } = actionBlockConfig;

  const text = scope.replace(actionBlockConfig.text);

  if (
    serializerType === "slack" &&
    links.supportsWebhook && // turned on at provider level
    useWebhook && // turned on at link level
    style === "button"
  ) {
    const actionId = scope.replace(actionBlockConfig.actionId);

    links.addWebhook("action", {
      actionId,
      text: scope.replace(text),
    });
    return;
  }

  links.addLink("action", {
    href: scope.replace(href),
    text: scope.replace(text),
  });
};

export default actionBlockComponentLinkDiscovery;
