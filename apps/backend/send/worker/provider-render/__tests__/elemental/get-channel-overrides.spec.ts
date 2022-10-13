import createVariableHandler from "~/lib/variable-handler";
import { getChannelOverrides } from "../../elemental/get-channel-overrides";

describe("getChannelOverrides", () => {
  it("should return correct overrides for email channel", () => {
    const overrides = getChannelOverrides({
      elements: [
        {
          type: "channel",
          channel: "sms",
          raw: {
            subject: "My Subject",
            html: "<html><p>Hello World!</p></html>",
            text: "Lorem ipsum dolor, sit amet",
          },
        },
        {
          type: "channel",
          channel: "email",
          raw: {
            subject: "My Subject",
            html: "<html><p>Hello World!</p></html>",
            text: "Lorem ipsum dolor, sit amet",
          },
        },
      ],
      channel: "email",
      variableHandler: createVariableHandler({ value: { data: {} } }),
    });

    expect(overrides).toEqual({
      subject: "My Subject",
      html: "<html><p>Hello World!</p></html>",
      text: "Lorem ipsum dolor, sit amet",
    });
  });

  it("should return correct overrides for email channel with mjml and handlebars transformers", () => {
    const overrides = getChannelOverrides({
      elements: [
        {
          type: "channel",
          channel: "email",
          raw: {
            subject: "My Subject",
            html: `
            <mjml>
              <mj-body>
                <mj-section>
                  <mj-column>
                    <mj-text>
                      {{message}}
                    </mj-text>
                  </mj-column>
                </mj-section>
              </mj-body>
            </mjml>
            `,
            text: "Lorem ipsum dolor, sit amet",
            transformers: ["mjml", "handlebars"],
          },
        },
      ],
      channel: "email",
      variableHandler: createVariableHandler({
        value: { data: { message: "Hello World!" } },
      }),
    });

    expect(overrides.html).toContain("Hello World!");
  });
});
