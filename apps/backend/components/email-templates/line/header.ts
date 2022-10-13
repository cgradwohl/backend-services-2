import { ILinkHandler } from "~/lib/link-handler";
import { EmailTemplateConfig } from "~/types.api";

export default (
  emailTemplateConfig: EmailTemplateConfig,
  linkHandler: ILinkHandler,
  variableReplacer: (str: string) => string
) => {
  const {
    headerLogoSrc,
    headerLogoHref,
    headerLogoRenderSize,
    headerLogoAlign = "left",
  } = emailTemplateConfig;

  const originalHref = variableReplacer(headerLogoHref || "");
  const href = originalHref && linkHandler.getHref("logo", originalHref);

  return `
    <mj-section padding="0px" css-class="c--email-header">
        <mj-column padding-top="20px" padding-left="10px">
        ${
          headerLogoSrc
            ? `<mj-image width="${
                headerLogoRenderSize
                  ? headerLogoRenderSize.width + "px"
                  : "140px"
              }" src="${headerLogoSrc}"${
                href ? ` href="${href}"` : ""
              } align="${headerLogoAlign}" />`
            : ""
        }
        </mj-column>
    </mj-section>
  `;
};
