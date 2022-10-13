import mjml2Html from "mjml";
import { IVariableHandler } from "~/lib/variable-handler";

export default (
  components: {
    head: string;
    header: string;
    blocks: string;
    footer: string;
  },
  overrides: {
    backgroundColor?: string;
    blocksBackgroundColor?: string;
    footerBackgroundColor?: string;
    footerFullWidth?: boolean;
    width?: string;
  },
  variableHandler: IVariableHandler
) => {
  const rootValue = variableHandler.getRootValue();

  const mjml = `
    <mjml>
    <mj-head>
        <mj-attributes>
            <mj-all font-family="Helvetica, Arial, sans-serif" />
            <mj-text padding="0px" font-size="14px" color="#4c4c4c"/>
            <mj-image padding="0px" />
            <mj-wrapper padding="0px"/>
            <mj-section padding="8px 30px" ${
              overrides.blocksBackgroundColor
                ? `background-color="${overrides.blocksBackgroundColor}"`
                : ""
            }/>
            <mj-column padding="0px" width="100%" />
        </mj-attributes>
        <mj-raw>${components.head}</mj-raw>
    </mj-head>
    <mj-body css-class="c--email-body" ${
      overrides.width ? `width="${overrides.width}"` : ""
    } ${
    overrides.backgroundColor
      ? `background-color="${overrides.backgroundColor}"`
      : ""
  }>
        <mj-wrapper>
            <mj-section padding="0px">
                <mj-column>
                    <mj-text>
                            ${components.header}
                    </mj-text>
                </mj-column>
            </mj-section>
            ${components.blocks}
        </mj-wrapper>
        <mj-wrapper css-class="c--email-footer" ${
          overrides.footerFullWidth ? `full-width="full-width"` : ""
        } ${
    overrides.footerBackgroundColor
      ? `background-color="${overrides.footerBackgroundColor}"`
      : ""
  }>
            <mj-section padding="0px">
                <mj-column>
                    <mj-text>
                            ${components.footer}
                    </mj-text>
                </mj-column>
            </mj-section>
        </mj-wrapper>
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
