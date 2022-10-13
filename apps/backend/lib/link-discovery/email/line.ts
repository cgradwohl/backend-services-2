import { supportedEmailFooterIcons } from "~/components/email-templates/line/footer";
import { ISerializableBlock } from "~/lib/blocks/serialize";
import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import { EmailTemplateConfig } from "~/types.api";

import htmlLinkDiscovery from "../html";
import slateLinkDiscoverySerializer from "../slate-serializer";

const lineEmailTemplateHeaderLinkDiscovery = (
  emailConfig: EmailTemplateConfig,
  linkHandler: ILinkHandler,
  variableHandler: IVariableHandler
) => {
  const { headerLogoHref } = emailConfig;
  const href = variableHandler.replace(headerLogoHref || "");

  if (href) {
    linkHandler.addLink("logo", { href });
  }
};

const lineEmailTemplateFooterLinkDiscovery = (
  emailConfig: EmailTemplateConfig,
  linkHandler: ILinkHandler,
  variableHandler: IVariableHandler
) => {
  const { footerLinks, footerText } = emailConfig;

  const icons = footerLinks
    ? supportedEmailFooterIcons.filter(icon => icon in footerLinks)
    : [];

  icons.forEach(icon => {
    const href = variableHandler.replace(footerLinks[icon]);
    linkHandler.addLink(icon, { href });
  });

  if (footerText) {
    slateLinkDiscoverySerializer(
      footerText,
      linkHandler,
      variableHandler.replace
    );
  }
};

const lineEmailTemplateLinkDiscovery = (
  blocks: ISerializableBlock[],
  emailConfig: EmailTemplateConfig,
  linkHandler: ILinkHandler,
  variableHandler: IVariableHandler
) => {
  lineEmailTemplateHeaderLinkDiscovery(
    emailConfig,
    linkHandler.getScopedHandler("html").getScopedHandler("email-header"),
    variableHandler
  );
  lineEmailTemplateFooterLinkDiscovery(
    emailConfig,
    linkHandler.getScopedHandler("html").getScopedHandler("email-footer"),
    variableHandler
  );
  htmlLinkDiscovery(blocks);
};

export default lineEmailTemplateLinkDiscovery;
