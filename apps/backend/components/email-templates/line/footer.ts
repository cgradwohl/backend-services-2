import serializeHtml from "~/lib/serialize-html";

import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import { EmailTemplateConfig, ITenant } from "~/types.api";
import getTextStyle from "../../lib/text-styles";

const emailWidth = 580;
const sectionPadding = 10;
const paddingHorizontal = 20;
const paddingVertical = 10;
const iconWidth = 18;
const iconMargin = 4;

export const supportedEmailFooterIcons = [
  "facebook",
  "instagram",
  "linkedin",
  "medium",
  "twitter",
];

const poweredByCourier = `<mj-section css-class="c--email-footer" padding="${sectionPadding}px" padding-top="0px">
<mj-column padding-bottom="10px">
  <mj-text ${getTextStyle(
    "subtext"
  )} align="center" css-class="c--text-subtext">
    Powered By <strong><a href="https://www.courier.com?utm_source=tenantId&utm_medium=email&utm_campaign=courier-footer-referral">Courier</a></strong>
  </mj-text>
</mj-column>
</mj-section>`;

export default (
  tenant: ITenant,
  emailTemplateConfig: EmailTemplateConfig,
  linkHandler: ILinkHandler,
  variableReplacer: IVariableHandler["replace"]
) => {
  const { footerLinks, footerText } = emailTemplateConfig;

  const icons =
    footerLinks &&
    supportedEmailFooterIcons.filter((icon) => icon in footerLinks);
  const hasIcons: boolean = Boolean(icons && icons.length);

  const renderedFooterText = (
    (footerText && serializeHtml(footerText, linkHandler, variableReplacer)) ||
    ""
  ).trim();

  if (renderedFooterText === "" && !hasIcons) {
    return tenant?.showCourierFooter
      ? poweredByCourier
      : `
    <mj-section css-class="c--email-footer" padding="0px">
      <mj-column padding="0px">	
        <mj-spacer height="20px" />	
      </mj-column>	
    </mj-section>`;
  }

  const divider = `<mj-section padding="0px">
    <mj-column padding="0px">
      <mj-divider container-background-color="#ffffff" border-width="1px" border-color="#f7f7f7" padding="20px 0 0 0"/>
    </mj-column>
  </mj-section>`;

  if (!hasIcons) {
    return `${divider}
    <mj-section css-class="c--email-footer" padding="${sectionPadding}px">
      <mj-column padding="${paddingVertical}px ${paddingHorizontal}px">
        <mj-text ${getTextStyle(
          "subtext"
        )} align="left" css-class="c--text-subtext">
            ${renderedFooterText}
        </mj-text>
      </mj-column>
    </mj-section>
    ${tenant?.showCourierFooter ? poweredByCourier : ""}
    `;
  }

  const iconColumnWidth =
    icons.length * (iconMargin + iconWidth + iconMargin) + paddingHorizontal; // padding only on right
  const textColumnWidth =
    emailWidth - sectionPadding - sectionPadding - iconColumnWidth;

  return `${divider}
  <mj-section css-class="c--email-footer" padding="${sectionPadding}px">
    <mj-column width="${textColumnWidth}px" padding="${paddingVertical}px ${paddingHorizontal}px">
      <mj-text ${getTextStyle(
        "subtext"
      )} align="left" css-class="c--text-subtext">
          ${renderedFooterText}
      </mj-text>
    </mj-column>
    <mj-column width="${iconColumnWidth}px" padding="${paddingVertical}px ${paddingHorizontal}px ${paddingVertical}px 0px">
      <mj-social css-class="c--social" font-size="15px" icon-size="${iconWidth}px" mode="horizontal" padding="0px" align="center" border-radius="0px">
        ${icons
          .map((icon) => {
            const href = linkHandler.getHref(
              icon,
              variableReplacer(footerLinks[icon])
            );

            return `
            <mj-social-element href="${href}" background-color="#FFFFFF" icon-size="${iconWidth}px" src="https://backend-production-librarybucket-1izigk5lryla9.s3.amazonaws.com/static/${icon}.png?v=2"></mj-social-element>`;
          })
          .join("")}
      </mj-social>
    </mj-column>
  </mj-section>
  ${tenant?.showCourierFooter ? poweredByCourier : ""}
  `;
};
