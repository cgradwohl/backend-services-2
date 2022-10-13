import mjml2Html from "mjml";

import { ILinkHandler } from "~/lib/link-handler";
import { IVariableHandler } from "~/lib/variable-handler";
import { EmailTemplateConfig } from "~/types.api";

import footer from "./footer";
import header from "./header";

export default (
  tenant,
  {
    blocks,
    head,
  }: {
    blocks: string;
    head: string;
  },
  emailTemplateConfig: EmailTemplateConfig,
  linkHandler: ILinkHandler,
  variableHandler: IVariableHandler
) => {
  const topBarColor = variableHandler.replace(
    emailTemplateConfig.topBarColor || "white"
  );
  const rootValue = variableHandler.getRootValue();

  const mjml = `
  <mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Helvetica, Arial, sans-serif" />
      <mj-text padding="0px"/>
      <mj-image padding="0px" />
      <mj-wrapper padding="20px 0 0 0" />
      <mj-section padding="8px 30px" background-color="#ffffff"/>
      <mj-column padding="0px" width="100%" background-color="#ffffff"/>
    </mj-attributes>
    <mj-style inline="inline">
      .c--email-header, .c--email-footer {
        background: #FFFFFF;
      }

      .c--email-header {
        border-top: 6px solid ${topBarColor};
        border-radius: 7px 7px 0 0;
        border-bottom: 1px solid #f7f7f7;
        padding-bottom: 20px;
        padding-left: 10px;
      }

      .c--email-footer {
        border-bottom: 1px solid white;
        border-radius: 0 0 7px 7px;
      }

      p {
        margin: 0;
      }

      a {
        color: #2a9edb;
        font-weight: 500;
        text-decoration: none;
      }
    </mj-style>
    ${head ? `<mj-raw>${head}</mj-raw>` : ""}
  </mj-head>
  <mj-body css-class="c--email-body" background-color="#f5f5f5" width="580px">
    <mj-wrapper>
      ${header(
        emailTemplateConfig,
        linkHandler.getScopedHandler("html").getScopedHandler("email-header"),
        variableHandler.replace
      )}
      <mj-section>
        <mj-column></mj-column>
      </mj-section>
        ${blocks}
        ${footer(
          tenant,
          emailTemplateConfig,
          linkHandler.getScopedHandler("html").getScopedHandler("email-footer"),
          variableHandler.replace
        )}
    </mj-wrapper>
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
