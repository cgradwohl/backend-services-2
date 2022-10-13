import { Value } from "slate";

import { ISerializableBlock } from "~/lib/blocks/serialize";
import {
  DeliveryHandlerParams,
  IProviderLinkDiscoveryHandler,
} from "~/providers/types";
import { EmailTemplateConfig, EmailTemplateName } from "~/types.api";

import plainLinkDiscovery from "../plain";
import lineEmailTemplate from "./line";
import noneEmailTemplate from "./none";
import inboxEmailTemplate from "./inbox";

const templateLinkDiscovery: { [template in EmailTemplateName]: any } = {
  inbox: inboxEmailTemplate,
  line: lineEmailTemplate,
  none: noneEmailTemplate,
};

const emailLinkDiscovery: IProviderLinkDiscoveryHandler = (
  blocks: ISerializableBlock[],
  params: DeliveryHandlerParams
) => {
  const {
    isUsingTemplateOverride,
    emailTemplateConfig: emailTemplateWireConfig = {},
    linkHandler,
    templateOverride = "",
    variableHandler,
  } = params;

  if (isUsingTemplateOverride && templateOverride.length > 0) {
    return;
  }

  const footerText =
    Value.isValue(emailTemplateWireConfig.footerText) ||
    !emailTemplateWireConfig.footerText
      ? emailTemplateWireConfig.footerText
      : Value.fromJSON(JSON.parse(emailTemplateWireConfig.footerText));

  const emailTemplateConfig: EmailTemplateConfig = {
    ...emailTemplateWireConfig,
    footerText,
  };

  const templateName = emailTemplateConfig.templateName || "none";

  templateLinkDiscovery[templateName](
    blocks,
    emailTemplateConfig,
    linkHandler,
    variableHandler
  );

  plainLinkDiscovery(blocks);
};

export default emailLinkDiscovery;
