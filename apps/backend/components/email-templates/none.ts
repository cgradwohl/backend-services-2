import mjml2Html from "mjml";
import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import { EmailTemplateConfig } from "~/types.api";

export default (
  tenant,
  {
    blocks,
  }: {
    blocks: string;
  },
  emailTemplateConfig: EmailTemplateConfig,
  linkHandler: ILinkHandler,
  variableHandler: IVariableHandler
) => {
  const rootValue = variableHandler.getRootValue();

  const mjml = `
    <mjml>
    <mj-head>
      <mj-attributes>
        <mj-all font-family="Helvetica, Arial, sans-serif" />
        <mj-text padding="0px"/>
        <mj-image padding="0px" />
        <mj-section padding="0 10px" />
        <mj-column padding="20px 20px 0 20px" width="100%"/>
      </mj-attributes>
    </mj-head>
    <mj-body css-class="c--email-body">
      ${blocks}
      ${
        rootValue.urls && rootValue.urls.opened
          ? `
          <mj-raw>
            <img src="${rootValue.urls.opened}" />
          </mj-raw>
        `
          : ""
      }
    </mj-body>
    </mjml>
    `;

  const renderedHtml = mjml2Html(mjml, {});

  return renderedHtml.html;
};
