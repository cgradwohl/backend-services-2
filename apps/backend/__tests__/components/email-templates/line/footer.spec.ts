import { Value } from "slate";
import Plain from "slate-plain-serializer";
import createLinkHandler from "~/lib/link-handler";
import footer from "../../../../components/email-templates/line/footer";
import createVariableHandler from "../../../../lib/variable-handler";

const generateFooterText = (text: string): Value =>
  (Plain.deserialize(text) as unknown) as Value;

const mockData = {
  domain: "https://example.com",
};

const { replace: mockVariableReplacer } = createVariableHandler({
  value: mockData,
});
const linkHandler = createLinkHandler({});

const mockTenant = {
  tenantId: "MockTenantId",
  creator: "123",
  created: 123,
  defaultBrandId: "123",
  name: "mockTenant",
};

describe("line footer", () => {
  test("should return mjml template strings", async () => {
    expect(
      footer(
        mockTenant,
        {
          footerText: generateFooterText("Footer text"),
        },
        linkHandler,
        mockVariableReplacer
      )
    ).toMatchInlineSnapshot(`
      "<mj-section padding=\\"0px\\">
          <mj-column padding=\\"0px\\">
            <mj-divider container-background-color=\\"#ffffff\\" border-width=\\"1px\\" border-color=\\"#f7f7f7\\" padding=\\"20px 0 0 0\\"/>
          </mj-column>
        </mj-section>
          <mj-section css-class=\\"c--email-footer\\" padding=\\"10px\\">
            <mj-column padding=\\"10px 20px\\">
              <mj-text color=\\"#8F8F8F\\" font-size=\\"11px\\" line-height=\\"15px\\" align=\\"left\\" css-class=\\"c--text-subtext\\">
                  Footer text
              </mj-text>
            </mj-column>
          </mj-section>
          
          "
    `);
  });

  test("should handle social links", async () => {
    expect(
      footer(
        mockTenant,
        {
          footerLinks: {
            facebook: "{domain}/facebook",
            instagram: "{domain}/instagram",
            linkedin: "{domain}/linkedin",
            medium: "{domain}/medium",
            twitter: "{domain}/twitter",
          },
          footerText: generateFooterText("Footer text"),
        },
        linkHandler,
        mockVariableReplacer
      )
    ).toMatchInlineSnapshot(`
      "<mj-section padding=\\"0px\\">
          <mj-column padding=\\"0px\\">
            <mj-divider container-background-color=\\"#ffffff\\" border-width=\\"1px\\" border-color=\\"#f7f7f7\\" padding=\\"20px 0 0 0\\"/>
          </mj-column>
        </mj-section>
        <mj-section css-class=\\"c--email-footer\\" padding=\\"10px\\">
          <mj-column width=\\"410px\\" padding=\\"10px 20px\\">
            <mj-text color=\\"#8F8F8F\\" font-size=\\"11px\\" line-height=\\"15px\\" align=\\"left\\" css-class=\\"c--text-subtext\\">
                Footer text
            </mj-text>
          </mj-column>
          <mj-column width=\\"150px\\" padding=\\"10px 20px 10px 0px\\">
            <mj-social css-class=\\"c--social\\" font-size=\\"15px\\" icon-size=\\"18px\\" mode=\\"horizontal\\" padding=\\"0px\\" align=\\"center\\" border-radius=\\"0px\\">
              
                  <mj-social-element href=\\"https://example.com/facebook\\" background-color=\\"#FFFFFF\\" icon-size=\\"18px\\" src=\\"https://backend-production-librarybucket-1izigk5lryla9.s3.amazonaws.com/static/facebook.png?v=2\\"></mj-social-element>
                  <mj-social-element href=\\"https://example.com/instagram\\" background-color=\\"#FFFFFF\\" icon-size=\\"18px\\" src=\\"https://backend-production-librarybucket-1izigk5lryla9.s3.amazonaws.com/static/instagram.png?v=2\\"></mj-social-element>
                  <mj-social-element href=\\"https://example.com/linkedin\\" background-color=\\"#FFFFFF\\" icon-size=\\"18px\\" src=\\"https://backend-production-librarybucket-1izigk5lryla9.s3.amazonaws.com/static/linkedin.png?v=2\\"></mj-social-element>
                  <mj-social-element href=\\"https://example.com/medium\\" background-color=\\"#FFFFFF\\" icon-size=\\"18px\\" src=\\"https://backend-production-librarybucket-1izigk5lryla9.s3.amazonaws.com/static/medium.png?v=2\\"></mj-social-element>
                  <mj-social-element href=\\"https://example.com/twitter\\" background-color=\\"#FFFFFF\\" icon-size=\\"18px\\" src=\\"https://backend-production-librarybucket-1izigk5lryla9.s3.amazonaws.com/static/twitter.png?v=2\\"></mj-social-element>
            </mj-social>
          </mj-column>
        </mj-section>
        
        "
    `);
  });
});
