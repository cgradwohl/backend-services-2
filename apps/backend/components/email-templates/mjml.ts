import mjml2Html from "mjml";
import { IBrand } from "~/lib/brands/types";
import { IVariableHandler } from "~/lib/variable-handler";

export default (
  components: {
    head: string;
    header: string;
    blocks: string;
    footer: string;
  },
  templateOverride: IBrand["settings"]["email"]["templateOverride"],
  variableHandler: IVariableHandler
) => {
  const rootValue = variableHandler.getRootValue();

  const mjml = `
    <mjml>
    <mj-head>
        ${components.head}
    </mj-head>
    <mj-body css-class="c--email-body" ${
      templateOverride.width ? `width="${templateOverride.width}"` : ""
    } ${
    templateOverride.backgroundColor
      ? `background-color="${templateOverride.backgroundColor}"`
      : ""
  }>
        ${components.header}
        ${components.blocks}
        ${components.footer}
        ${
          rootValue.urls && rootValue.urls.opened
            ? `
      <mj-raw><img src="${rootValue.urls.opened}" /></mj-raw>
            `
            : ""
        }
    </mj-body>
    </mjml>
    `;

  const renderedHtml = mjml2Html(mjml, {});

  return renderedHtml.html;
};
