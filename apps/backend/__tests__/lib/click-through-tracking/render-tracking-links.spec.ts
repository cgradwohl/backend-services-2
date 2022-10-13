import { Value } from "slate";

import getBlocks from "~/lib/blocks";
import createLinkHandler, { ILinkData } from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { DeliveryHandlerParams } from "~/providers/types";
import { BlockWire } from "~/types.api";

import emailLinkDiscovery from "~/lib/link-discovery/email";
import htmlLinkDiscovery from "~/lib/link-discovery/html";
import markdownLinkDiscovery from "~/lib/link-discovery/md";
import plainLinkDiscovery from "~/lib/link-discovery/plain";
import slackLinkDiscovery from "~/lib/link-discovery/slack";
import renderEmail from "~/lib/render/email";
import renderHtml from "~/lib/render/html";
import renderMarkdown from "~/lib/render/md";
import renderPlain from "~/lib/render/plain";
import renderSlack from "~/lib/render/slack";

import fixtures from "./__fixtures__";
import { CourierRenderOverrides } from "~/types.internal";

const helperGenerateTrackingLink = (links: {
  [context: string]: ILinkData;
}) => {
  let index = 0;
  Object.keys(links).forEach((context) => {
    const id = `${index++}`;
    links[context].trackingId = id;
    links[context].trackingHref = `https://tenant-subdomain.ct0.app/r/${id}`;
  });
};

const helperPrepareBlocks = (
  blocks: BlockWire[],
  linkHandler,
  variableHandler
) => {
  return getBlocks(blocks, linkHandler, variableHandler);
};

describe("Click-Through Tracking", () => {
  describe("render plain", () => {
    it("should work with no links", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "twilio" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.textBlock],
        linkHandler,
        variableHandler
      );

      plainLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderPlain(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "plain": "test",
        }
      `);
    });
    it("should generate ctt links in text blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "twilio" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.textBlockWithLinks],
        linkHandler,
        variableHandler
      );

      plainLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderPlain(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "plain": "Text with multiple links: a (https://tenant-subdomain.ct0.app/r/0), b (https://tenant-subdomain.ct0.app/r/1), c (https://tenant-subdomain.ct0.app/r/2).",
        }
      `);
    });
    it("should generate ctt links in action blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "twilio" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionBlock],
        linkHandler,
        variableHandler
      );

      plainLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderPlain(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "plain": "Learn More: https://tenant-subdomain.ct0.app/r/0",
        }
      `);
    });
    it("should generate ctt links with variables in action blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {
          cta: "Click now!",
          url: "https://example.com",
        },
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({
        value: variableData,
      }).getScoped("data");
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "twilio" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionBlockWithVariables],
        linkHandler,
        variableHandler
      );

      plainLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderPlain(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "plain": "Click now!: https://tenant-subdomain.ct0.app/r/0",
        }
      `);
    });
    it("should generate ctt links in action link blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "twilio" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionLinkBlock],
        linkHandler,
        variableHandler
      );

      plainLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderPlain(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "plain": "Learn More: https://tenant-subdomain.ct0.app/r/0",
        }
      `);
    });
    it("should generate ctt links in list blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {
          list: [{ value: "a" }, { value: "b" }, { value: "c" }],
        },
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({
        value: variableData,
      }).getScoped("data");
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "twilio" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.listBlockWithLinks],
        linkHandler,
        variableHandler
      );

      plainLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderPlain(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "plain": "a (https://tenant-subdomain.ct0.app/r/0)

        b (https://tenant-subdomain.ct0.app/r/1)

        c (https://tenant-subdomain.ct0.app/r/2)",
        }
      `);
    });
  });
  describe("render html", () => {
    it("should work with no links", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "sendgrid" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.textBlock],
        linkHandler,
        variableHandler
      );

      htmlLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderHtml(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "html": "
            <mj-section css-class=\\"c--block c--block-text\\">
              <mj-column background-color=\\"transparent\\" padding=\\"4px 0px\\">
                <mj-text color=\\"#4C4C4C\\" font-size=\\"14px\\" line-height=\\"18px\\" align=\\"left\\" css-class=\\"c--text-text\\">
                    test
                </mj-text>
              </mj-column>
            </mj-section>
          ",
        }
      `);
    });
    it("should generate ctt links in text blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "sendgrid" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.textBlockWithLinks],
        linkHandler,
        variableHandler
      );

      htmlLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderHtml(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "html": "
            <mj-section css-class=\\"c--block c--block-text\\">
              <mj-column background-color=\\"transparent\\" padding=\\"4px 0px\\">
                <mj-text color=\\"#4C4C4C\\" font-size=\\"14px\\" line-height=\\"18px\\" align=\\"left\\" css-class=\\"c--text-text\\">
                    Text with multiple links: <a href=\\"https://tenant-subdomain.ct0.app/r/0\\">a</a>, <a href=\\"https://tenant-subdomain.ct0.app/r/1\\">b</a>, <a href=\\"https://tenant-subdomain.ct0.app/r/2\\">c</a>.
                </mj-text>
              </mj-column>
            </mj-section>
          ",
        }
      `);
    });
    it("should generate ctt links in action blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "sendgrid" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionBlock],
        linkHandler,
        variableHandler
      );

      htmlLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderHtml(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "html": "
            <mj-section css-class=\\"c--block c--block-action\\">
              <mj-column padding=\\"8px 0px\\">
                
              <mj-button align=\\"center\\" href=\\"https://tenant-subdomain.ct0.app/r/0\\" background-color=\\"#9D3789\\" border-radius=\\"4px\\" font-size=\\"14px\\" inner-padding=\\"10px 20px\\" padding=\\"0px\\">
                Learn More
              </mj-button>
            
              </mj-column>
            </mj-section>
          ",
        }
      `);
    });
    it("should generate ctt links in action link blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "sendgrid" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionLinkBlock],
        linkHandler,
        variableHandler
      );

      htmlLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderHtml(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "html": "
            <mj-section css-class=\\"c--block c--block-action\\">
              <mj-column padding=\\"8px 0px\\">
                
                <mj-text align=\\"left\\">
                  <a href=\\"https://tenant-subdomain.ct0.app/r/0\\" target=\\"_blank\\">Learn More</a>
                </mj-text>
              
              </mj-column>
            </mj-section>
          ",
        }
      `);
    });
    it("should generate ctt links in list blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {
          list: [{ value: "a" }, { value: "b" }, { value: "c" }],
        },
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({
        value: variableData,
      }).getScoped("data");
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "sendgrid" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.listBlockWithLinks],
        linkHandler,
        variableHandler
      );

      htmlLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderHtml(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "html": "
            <mj-section css-class=\\"c--block c--block-list\\">
              <mj-column padding-top=\\"0px\\">
                <mj-text>
                    <div style=\\";text-align:left\\">
        <a href=\\"https://tenant-subdomain.ct0.app/r/0\\">a</a>
        </div>

        <div style=\\"padding-top:20px;text-align:left\\">
        <a href=\\"https://tenant-subdomain.ct0.app/r/1\\">b</a>
        </div>

        <div style=\\"padding-top:20px;text-align:left\\">
        <a href=\\"https://tenant-subdomain.ct0.app/r/2\\">c</a>
        </div>

                </mj-text>
              </mj-column>
            </mj-section>
          ",
        }
      `);
    });
    it("should generate ctt links in template blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "sendgrid" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.templateBlockWithLink],
        linkHandler,
        variableHandler
      );

      htmlLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderHtml(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "html": "
              <mj-section css-class=\\"c--block c--block-template\\">
                <mj-column>
                    <mj-text color=\\"#4C4C4C\\" font-size=\\"14px\\" line-height=\\"18px\\" css-class=\\"c--text-text\\">
                            <a href=\\"https://tenant-subdomain.ct0.app/r/0\\">test link</a>
                    </mj-text>
                </mj-column>
              </mj-section>
            ",
        }
      `);
    });
  });
  describe("render markdown", () => {
    it("should work with no links", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "msteams" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.textBlock],
        linkHandler,
        variableHandler
      );

      markdownLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderMarkdown(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "md": "test",
        }
      `);
    });
    it("should generate ctt links in text blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "msteams" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.textBlockWithLinks],
        linkHandler,
        variableHandler
      );

      markdownLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderMarkdown(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "md": "Text with multiple links: [a](https://tenant-subdomain.ct0.app/r/0), [b](https://tenant-subdomain.ct0.app/r/1), [c](https://tenant-subdomain.ct0.app/r/2).",
        }
      `);
    });
    it("should generate ctt links in action blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "msteams" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionBlock],
        linkHandler,
        variableHandler
      );

      markdownLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderMarkdown(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "md": "[Learn More](https://tenant-subdomain.ct0.app/r/0)",
        }
      `);
    });
    it("should generate ctt links in action link blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "msteams" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionLinkBlock],
        linkHandler,
        variableHandler
      );

      markdownLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderMarkdown(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "md": "[Learn More](https://tenant-subdomain.ct0.app/r/0)",
        }
      `);
    });
    it("should generate ctt links in list blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {
          list: [{ value: "a" }, { value: "b" }, { value: "c" }],
        },
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({
        value: variableData,
      }).getScoped("data");
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "msteams" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.listBlockWithLinks],
        linkHandler,
        variableHandler
      );

      markdownLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderMarkdown(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "md": "[a](https://tenant-subdomain.ct0.app/r/0)

        [b](https://tenant-subdomain.ct0.app/r/1)

        [c](https://tenant-subdomain.ct0.app/r/2)",
        }
      `);
    });
  });
  describe("render slack markdown", () => {
    it("should work with no links", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "slack" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.textBlock],
        linkHandler,
        variableHandler
      );

      slackLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderSlack(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "slackBlocks": Array [
            Object {
              "text": Object {
                "text": "test",
                "type": "mrkdwn",
              },
              "type": "section",
            },
          ],
          "text": "test",
        }
      `);
    });
    it("should generate ctt links in text blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "slack" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.textBlockWithLinks],
        linkHandler,
        variableHandler
      );

      slackLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderSlack(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "slackBlocks": Array [
            Object {
              "text": Object {
                "text": "Text with multiple links: <https://tenant-subdomain.ct0.app/r/0|a>, <https://tenant-subdomain.ct0.app/r/1|b>, <https://tenant-subdomain.ct0.app/r/2|c>.",
                "type": "mrkdwn",
              },
              "type": "section",
            },
          ],
          "text": "Text with multiple links: a (https://tenant-subdomain.ct0.app/r/3), b (https://tenant-subdomain.ct0.app/r/4), c (https://tenant-subdomain.ct0.app/r/5).",
        }
      `);
    });
    it("should generate ctt links in action blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "slack" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionBlock],
        linkHandler,
        variableHandler
      );

      slackLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderSlack(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "slackBlocks": Array [
            Object {
              "elements": Array [
                Object {
                  "action_id": undefined,
                  "text": Object {
                    "emoji": true,
                    "text": "Learn More",
                    "type": "plain_text",
                  },
                  "type": "button",
                  "url": "https://tenant-subdomain.ct0.app/r/0",
                },
              ],
              "type": "actions",
            },
          ],
          "text": "",
        }
      `);
    });
    it("should generate ctt webhooks in action blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "slack" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionBlockWithWebhook],
        linkHandler,
        variableHandler
      );

      slackLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderSlack(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "slackBlocks": Array [
            Object {
              "elements": Array [
                Object {
                  "action_id": "0",
                  "text": Object {
                    "emoji": true,
                    "text": "Learn More",
                    "type": "plain_text",
                  },
                  "type": "button",
                  "url": undefined,
                },
              ],
              "type": "actions",
            },
          ],
          "text": "",
        }
      `);
    });
    it("should generate ctt links in action link blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {},
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({ value: variableData });
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "slack" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.actionLinkBlock],
        linkHandler,
        variableHandler
      );

      slackLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderSlack(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "slackBlocks": Array [
            Object {
              "text": Object {
                "text": "<https://tenant-subdomain.ct0.app/r/0|Learn More>",
                "type": "mrkdwn",
              },
              "type": "section",
            },
          ],
          "text": "",
        }
      `);
    });
    it("should generate ctt links in list blocks", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {
          list: [{ value: "a" }, { value: "b" }, { value: "c" }],
        },
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({
        value: variableData,
      }).getScoped("data");
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "slack" },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.listBlockWithLinks],
        linkHandler,
        variableHandler
      );

      slackLinkDiscovery(blocks);
      helperGenerateTrackingLink(links);
      const template = renderSlack(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "slackBlocks": Array [
            Object {
              "text": Object {
                "text": "<https://tenant-subdomain.ct0.app/r/0|a>

        <https://tenant-subdomain.ct0.app/r/1|b>

        <https://tenant-subdomain.ct0.app/r/2|c>",
                "type": "mrkdwn",
              },
              "type": "section",
            },
          ],
          "text": "a (https://tenant-subdomain.ct0.app/r/3)

        b (https://tenant-subdomain.ct0.app/r/4)

        c (https://tenant-subdomain.ct0.app/r/5)",
        }
      `);
    });
  });
  describe("render email", () => {
    it("should generate ctt link for header logo, footer text, and footer social links", () => {
      const profile = {};
      const variableData = {
        courier: {
          environment: "production",
          scope: "published",
        } as CourierRenderOverrides,
        data: {
          list: [{ value: "a" }, { value: "b" }, { value: "c" }],
        },
        event: "mock-event",
        profile,
        recipient: "mock-recipient",
      };
      const variableHandler = createVariableHandler({
        value: variableData,
      }).getScoped("data");
      const links = {};
      const linkHandler = createLinkHandler(links, true);
      const params: DeliveryHandlerParams = {
        config: { provider: "sendgrid" },
        emailTemplateConfig: {
          footerLinks: {
            facebook: "https://fb.me/trycourier",
          },
          footerText: fixtures.json.emailFooterText as unknown as Value,
          headerLogoHref: "https://example.com",
          headerLogoSrc: "https://my.image/src",
          templateName: "line",
          topBarColor: "#9D3789",
        },
        linkHandler,
        profile,
        variableData,
        variableHandler,
      };
      const blocks = helperPrepareBlocks(
        [fixtures.json.listBlockWithLinks],
        linkHandler,
        variableHandler
      );

      emailLinkDiscovery(blocks, params);
      helperGenerateTrackingLink(links);
      const template = renderEmail(blocks, params);
      expect(template).toMatchInlineSnapshot(`
        Object {
          "bcc": undefined,
          "cc": undefined,
          "from": undefined,
          "html": "
            <!doctype html>
            <html xmlns=\\"http://www.w3.org/1999/xhtml\\" xmlns:v=\\"urn:schemas-microsoft-com:vml\\" xmlns:o=\\"urn:schemas-microsoft-com:office:office\\">
              <head>
                <title>
                  
                </title>
                <!--[if !mso]><!-- -->
                <meta http-equiv=\\"X-UA-Compatible\\" content=\\"IE=edge\\">
                <!--<![endif]-->
                <meta http-equiv=\\"Content-Type\\" content=\\"text/html; charset=UTF-8\\">
                <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\">
                <style type=\\"text/css\\">
                  #outlook a { padding:0; }
                  body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
                  table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
                  img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
                  p { display:block;margin:13px 0; }
                </style>
                <!--[if mso]>
                <xml>
                <o:OfficeDocumentSettings>
                  <o:AllowPNG/>
                  <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
                </xml>
                <![endif]-->
                <!--[if lte mso 11]>
                <style type=\\"text/css\\">
                  .outlook-group-fix { width:100% !important; }
                </style>
                <![endif]-->
                
                
            <style type=\\"text/css\\">
              @media only screen and (min-width:480px) {
                .mj-column-per-100 { width:100% !important; max-width: 100%; }
        .mj-column-px-514 { width:514px !important; max-width: 514px; }
        .mj-column-px-46 { width:46px !important; max-width: 46px; }
              }
            </style>
            
          
                <style type=\\"text/css\\">
                
                

            @media only screen and (max-width:480px) {
              table.full-width-mobile { width: 100% !important; }
              td.full-width-mobile { width: auto !important; }
            }
          
                </style>
                
                
              </head>
              <body style=\\"background-color:#f5f5f5;\\">
                
                
              <div class=\\"c--email-body\\" style=\\"background-color:#f5f5f5;\\">
                
              
              <!--[if mso | IE]>
              <table
                 align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" class=\\"\\" style=\\"width:580px;\\" width=\\"580\\"
              >
                <tr>
                  <td style=\\"line-height:0px;font-size:0px;mso-line-height-rule:exactly;\\">
              <![endif]-->
            
              
              <div style=\\"margin:0px auto;max-width:580px;\\">
                
                <table align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style=\\"width:100%;\\">
                  <tbody>
                    <tr>
                      <td style=\\"direction:ltr;font-size:0px;padding:20px 0 0 0;text-align:center;\\">
                        <!--[if mso | IE]>
                          <table role=\\"presentation\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\">
                        
                    <tr>
                      <td
                         class=\\"c--email-header-outlook\\" width=\\"580px\\"
                      >
                  
              <table
                 align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" class=\\"c--email-header-outlook\\" style=\\"width:580px;\\" width=\\"580\\"
              >
                <tr>
                  <td style=\\"line-height:0px;font-size:0px;mso-line-height-rule:exactly;\\">
              <![endif]-->
            
              
              <div class=\\"c--email-header\\" style=\\"border-top: 6px solid #9D3789; border-radius: 7px 7px 0 0; border-bottom: 1px solid #f7f7f7; padding-bottom: 20px; padding-left: 10px; background: #ffffff; background-color: #ffffff; margin: 0px auto; max-width: 580px;\\">
                
                <table align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style=\\"background:#ffffff;background-color:#ffffff;width:100%;\\">
                  <tbody>
                    <tr>
                      <td style=\\"direction:ltr;font-size:0px;padding:0px;text-align:center;\\">
                        <!--[if mso | IE]>
                          <table role=\\"presentation\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\">
                        
                <tr>
              
                    <td
                       class=\\"\\" style=\\"vertical-align:top;width:580px;\\"
                    >
                  <![endif]-->
                    
              <div class=\\"mj-column-per-100 outlook-group-fix\\" style=\\"font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;\\">
                
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" width=\\"100%\\">
                <tbody>
                  <tr>
                    <td style=\\"background-color:#ffffff;vertical-align:top;padding:0px;padding-top:20px;padding-left:10px;\\">
                      
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style width=\\"100%\\">
                
                    <tr>
                      <td align=\\"left\\" style=\\"font-size:0px;padding:0px;word-break:break-word;\\">
                        
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style=\\"border-collapse:collapse;border-spacing:0px;\\">
                <tbody>
                  <tr>
                    <td style=\\"width:140px;\\">
                      
                <a href=\\"https://tenant-subdomain.ct0.app/r/0\\" target=\\"_blank\\" style=\\"color: #2a9edb; font-weight: 500; text-decoration: none;\\">
                  
              <img height=\\"auto\\" src=\\"https://my.image/src\\" style=\\"border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;\\" width=\\"140\\">
            
                </a>
              
                    </td>
                  </tr>
                </tbody>
              </table>
            
                      </td>
                    </tr>
                  
              </table>
            
                    </td>
                  </tr>
                </tbody>
              </table>
            
              </div>
            
                  <!--[if mso | IE]>
                    </td>
                  
                </tr>
              
                          </table>
                        <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
                
              </div>
            
              
              <!--[if mso | IE]>
                  </td>
                </tr>
              </table>
              
                      </td>
                    </tr>
                  
                    <tr>
                      <td
                         class=\\"\\" width=\\"580px\\"
                      >
                  
              <table
                 align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" class=\\"\\" style=\\"width:580px;\\" width=\\"580\\"
              >
                <tr>
                  <td style=\\"line-height:0px;font-size:0px;mso-line-height-rule:exactly;\\">
              <![endif]-->
            
              
              <div style=\\"background:#ffffff;background-color:#ffffff;margin:0px auto;max-width:580px;\\">
                
                <table align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style=\\"background:#ffffff;background-color:#ffffff;width:100%;\\">
                  <tbody>
                    <tr>
                      <td style=\\"direction:ltr;font-size:0px;padding:8px 30px;text-align:center;\\">
                        <!--[if mso | IE]>
                          <table role=\\"presentation\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\">
                        
                <tr>
              
                    <td
                       class=\\"\\" style=\\"vertical-align:top;width:520px;\\"
                    >
                  <![endif]-->
                    
              <div class=\\"mj-column-per-100 outlook-group-fix\\" style=\\"font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;\\">
                
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" width=\\"100%\\">
                <tbody>
                  <tr>
                    <td style=\\"background-color:#ffffff;vertical-align:top;padding:0px;\\">
                      
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style width=\\"100%\\">
                
              </table>
            
                    </td>
                  </tr>
                </tbody>
              </table>
            
              </div>
            
                  <!--[if mso | IE]>
                    </td>
                  
                </tr>
              
                          </table>
                        <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
                
              </div>
            
              
              <!--[if mso | IE]>
                  </td>
                </tr>
              </table>
              
                      </td>
                    </tr>
                  
                    <tr>
                      <td
                         class=\\"c--block-outlook c--block-list-outlook\\" width=\\"580px\\"
                      >
                  
              <table
                 align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" class=\\"c--block-outlook c--block-list-outlook\\" style=\\"width:580px;\\" width=\\"580\\"
              >
                <tr>
                  <td style=\\"line-height:0px;font-size:0px;mso-line-height-rule:exactly;\\">
              <![endif]-->
            
              
              <div class=\\"c--block c--block-list\\" style=\\"background:#ffffff;background-color:#ffffff;margin:0px auto;max-width:580px;\\">
                
                <table align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style=\\"background:#ffffff;background-color:#ffffff;width:100%;\\">
                  <tbody>
                    <tr>
                      <td style=\\"direction:ltr;font-size:0px;padding:8px 30px;text-align:center;\\">
                        <!--[if mso | IE]>
                          <table role=\\"presentation\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\">
                        
                <tr>
              
                    <td
                       class=\\"\\" style=\\"vertical-align:top;width:520px;\\"
                    >
                  <![endif]-->
                    
              <div class=\\"mj-column-per-100 outlook-group-fix\\" style=\\"font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;\\">
                
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" width=\\"100%\\">
                <tbody>
                  <tr>
                    <td style=\\"background-color:#ffffff;vertical-align:top;padding:0px;padding-top:0px;\\">
                      
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style width=\\"100%\\">
                
                    <tr>
                      <td align=\\"left\\" style=\\"font-size:0px;padding:0px;word-break:break-word;\\">
                        
              <div style=\\"font-family:Helvetica, Arial, sans-serif;font-size:13px;line-height:1;text-align:left;color:#000000;\\"><div style=\\";text-align:left\\">
        <a href=\\"https://tenant-subdomain.ct0.app/r/3\\" style=\\"color: #2a9edb; font-weight: 500; text-decoration: none;\\">a</a>
        </div>

        <div style=\\"padding-top:20px;text-align:left\\">
        <a href=\\"https://tenant-subdomain.ct0.app/r/4\\" style=\\"color: #2a9edb; font-weight: 500; text-decoration: none;\\">b</a>
        </div>

        <div style=\\"padding-top:20px;text-align:left\\">
        <a href=\\"https://tenant-subdomain.ct0.app/r/5\\" style=\\"color: #2a9edb; font-weight: 500; text-decoration: none;\\">c</a>
        </div></div>
            
                      </td>
                    </tr>
                  
              </table>
            
                    </td>
                  </tr>
                </tbody>
              </table>
            
              </div>
            
                  <!--[if mso | IE]>
                    </td>
                  
                </tr>
              
                          </table>
                        <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
                
              </div>
            
              
              <!--[if mso | IE]>
                  </td>
                </tr>
              </table>
              
                      </td>
                    </tr>
                  
                    <tr>
                      <td
                         class=\\"\\" width=\\"580px\\"
                      >
                  
              <table
                 align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" class=\\"\\" style=\\"width:580px;\\" width=\\"580\\"
              >
                <tr>
                  <td style=\\"line-height:0px;font-size:0px;mso-line-height-rule:exactly;\\">
              <![endif]-->
            
              
              <div style=\\"background:#ffffff;background-color:#ffffff;margin:0px auto;max-width:580px;\\">
                
                <table align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style=\\"background:#ffffff;background-color:#ffffff;width:100%;\\">
                  <tbody>
                    <tr>
                      <td style=\\"direction:ltr;font-size:0px;padding:0px;text-align:center;\\">
                        <!--[if mso | IE]>
                          <table role=\\"presentation\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\">
                        
                <tr>
              
                    <td
                       class=\\"\\" style=\\"vertical-align:top;width:580px;\\"
                    >
                  <![endif]-->
                    
              <div class=\\"mj-column-per-100 outlook-group-fix\\" style=\\"font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;\\">
                
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" width=\\"100%\\">
                <tbody>
                  <tr>
                    <td style=\\"background-color:#ffffff;vertical-align:top;padding:0px;\\">
                      
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style width=\\"100%\\">
                
                    <tr>
                      <td style=\\"background:#ffffff;font-size:0px;padding:20px 0 0 0;word-break:break-word;\\">
                        
              <p style=\\"border-top: solid 1px #f7f7f7; font-size: 1; margin: 0px auto; width: 100%;\\">
              </p>
              
              <!--[if mso | IE]>
                <table
                   align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" style=\\"border-top:solid 1px #f7f7f7;font-size:1;margin:0px auto;width:580px;\\" role=\\"presentation\\" width=\\"580px\\"
                >
                  <tr>
                    <td style=\\"height:0;line-height:0;\\">
                      &nbsp;
                    </td>
                  </tr>
                </table>
              <![endif]-->
            
            
                      </td>
                    </tr>
                  
              </table>
            
                    </td>
                  </tr>
                </tbody>
              </table>
            
              </div>
            
                  <!--[if mso | IE]>
                    </td>
                  
                </tr>
              
                          </table>
                        <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
                
              </div>
            
              
              <!--[if mso | IE]>
                  </td>
                </tr>
              </table>
              
                      </td>
                    </tr>
                  
                    <tr>
                      <td
                         class=\\"c--email-footer-outlook\\" width=\\"580px\\"
                      >
                  
              <table
                 align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" class=\\"c--email-footer-outlook\\" style=\\"width:580px;\\" width=\\"580\\"
              >
                <tr>
                  <td style=\\"line-height:0px;font-size:0px;mso-line-height-rule:exactly;\\">
              <![endif]-->
            
              
              <div class=\\"c--email-footer\\" style=\\"border-bottom: 1px solid white; border-radius: 0 0 7px 7px; background: #ffffff; background-color: #ffffff; margin: 0px auto; max-width: 580px;\\">
                
                <table align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style=\\"background:#ffffff;background-color:#ffffff;width:100%;\\">
                  <tbody>
                    <tr>
                      <td style=\\"direction:ltr;font-size:0px;padding:10px;text-align:center;\\">
                        <!--[if mso | IE]>
                          <table role=\\"presentation\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\">
                        
                <tr>
              
                    <td
                       class=\\"\\" style=\\"vertical-align:top;width:514px;\\"
                    >
                  <![endif]-->
                    
              <div class=\\"mj-column-px-514 outlook-group-fix\\" style=\\"font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;\\">
                
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" width=\\"100%\\">
                <tbody>
                  <tr>
                    <td style=\\"background-color:#ffffff;vertical-align:top;padding:10px 20px;\\">
                      
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style width=\\"100%\\">
                
                    <tr>
                      <td align=\\"left\\" class=\\"c--text-subtext\\" style=\\"font-size:0px;padding:0px;word-break:break-word;\\">
                        
              <div style=\\"font-family:Helvetica, Arial, sans-serif;font-size:11px;line-height:15px;text-align:left;color:#8F8F8F;\\">You received this message because you signed up for Courier.<br>© 2020 Courier | San Francisco, CA | <a href=\\"https://tenant-subdomain.ct0.app/r/2\\" style=\\"color: #2a9edb; font-weight: 500; text-decoration: none;\\">unsubscribe</a></div>
            
                      </td>
                    </tr>
                  
              </table>
            
                    </td>
                  </tr>
                </tbody>
              </table>
            
              </div>
            
                  <!--[if mso | IE]>
                    </td>
                  
                    <td
                       class=\\"\\" style=\\"vertical-align:top;width:46px;\\"
                    >
                  <![endif]-->
                    
              <div class=\\"mj-column-px-46 outlook-group-fix\\" style=\\"font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;\\">
                
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" width=\\"100%\\">
                <tbody>
                  <tr>
                    <td style=\\"background-color:#ffffff;vertical-align:top;padding:10px 20px 10px 0px;\\">
                      
              <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style width=\\"100%\\">
                
                    <tr>
                      <td align=\\"center\\" class=\\"c--social\\" style=\\"font-size:0px;padding:0px;word-break:break-word;\\">
                        
              
             <!--[if mso | IE]>
              <table
                 align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\"
              >
                <tr>
              
                      <td>
                    <![endif]-->
                      <table align=\\"center\\" border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style=\\"float:none;display:inline-table;\\">
                        
              <tr>
                <td style=\\"padding:4px;\\">
                  <table border=\\"0\\" cellpadding=\\"0\\" cellspacing=\\"0\\" role=\\"presentation\\" style=\\"background:#FFFFFF;border-radius:0px;width:18px;\\">
                    <tr>
                      <td style=\\"font-size:0;height:18px;vertical-align:middle;width:18px;\\">
                        <a href=\\"https://tenant-subdomain.ct0.app/r/1\\" target=\\"_blank\\" style=\\"color: #2a9edb; font-weight: 500; text-decoration: none;\\">
                            <img height=\\"18\\" src=\\"https://backend-production-librarybucket-1izigk5lryla9.s3.amazonaws.com/static/facebook.png?v=2\\" style=\\"border-radius:0px;display:block;\\" width=\\"18\\">
                          </a>
                        </td>
                      </tr>
                  </table>
                </td>
                
              </tr>
            
                      </table>
                    <!--[if mso | IE]>
                      </td>
                    
                  </tr>
                </table>
              <![endif]-->
            
            
                      </td>
                    </tr>
                  
              </table>
            
                    </td>
                  </tr>
                </tbody>
              </table>
            
              </div>
            
                  <!--[if mso | IE]>
                    </td>
                  
                </tr>
              
                          </table>
                        <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
                
              </div>
            
              
              <!--[if mso | IE]>
                  </td>
                </tr>
              </table>
              
                      </td>
                    </tr>
                  
                          </table>
                        <![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table>
                
              </div>
            
              
              <!--[if mso | IE]>
                  </td>
                </tr>
              </table>
              <![endif]-->
            
            
              </div>
            
              </body>
            </html>
          ",
          "replyTo": undefined,
          "subject": "(no subject)",
          "text": "a (https://tenant-subdomain.ct0.app/r/6)

        b (https://tenant-subdomain.ct0.app/r/7)

        c (https://tenant-subdomain.ct0.app/r/8)",
        }
      `);
    });
  });
});
