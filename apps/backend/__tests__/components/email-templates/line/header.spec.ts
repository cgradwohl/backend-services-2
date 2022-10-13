import header from "~/components/email-templates/line/header";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { EmailTemplateConfig } from "~/types.api";

const mockData = {
  logoHref: "https://to.some/logo.png",
};

const { replace: mockVariableReplacer } = createVariableHandler({
  value: mockData,
});

const mockLinkHandler = createLinkHandler({});

const mockTemplateConfig: EmailTemplateConfig = {
  headerLogoHref: "mockHeaderLogoHref",
  headerLogoSrc: "mockHeaderLogoSrc",
  templateName: "line",
  topBarColor: "blue",
};

describe("line header", () => {
  test("should render header", async () => {
    const result = header(
      mockTemplateConfig,
      mockLinkHandler,
      mockVariableReplacer
    );
    expect(result).toMatchInlineSnapshot(`
      "
          <mj-section padding=\\"0px\\" css-class=\\"c--email-header\\">
              <mj-column padding-top=\\"20px\\" padding-left=\\"10px\\">
              <mj-image width=\\"140px\\" src=\\"mockHeaderLogoSrc\\" href=\\"mockHeaderLogoHref\\" align=\\"left\\" />
              </mj-column>
          </mj-section>
        "
    `);
  });

  test("should render header with variables", async () => {
    const result = header(
      {
        ...mockTemplateConfig,
        headerLogoHref: "{logoHref}",
      },
      mockLinkHandler,
      mockVariableReplacer
    );
    expect(result).toMatchInlineSnapshot(`
      "
          <mj-section padding=\\"0px\\" css-class=\\"c--email-header\\">
              <mj-column padding-top=\\"20px\\" padding-left=\\"10px\\">
              <mj-image width=\\"140px\\" src=\\"mockHeaderLogoSrc\\" href=\\"https://to.some/logo.png\\" align=\\"left\\" />
              </mj-column>
          </mj-section>
        "
    `);
  });
});
