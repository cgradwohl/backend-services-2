import { Value } from "slate";

import getBlocks from "~/lib/blocks";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";

import emailLinkDiscovery from "~/lib/link-discovery/email";
import mdLinkDiscovery from "~/lib/link-discovery/md";
import slackLinkDiscovery from "~/lib/link-discovery/slack";

import fixtures from "./__fixtures__";

describe("Link Discovery", () => {
  it("should return empty object if no links present", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const params: any = {
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.textBlock],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`Object {}`);
  });

  it("should return links from a text block", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const params: any = {
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.textBlockWithLink],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.html.text-block-with-link.rich-text.0": Object {
          "context": "$.html.text-block-with-link.rich-text.0",
          "options": Object {
            "href": "https://example.com",
            "text": "link",
          },
        },
        "$.plain.text-block-with-link.rich-text.0": Object {
          "context": "$.plain.text-block-with-link.rich-text.0",
          "options": Object {
            "href": "https://example.com",
            "text": "link",
          },
        },
      }
    `);
  });

  it("should return links from a text block with multiple links", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const params: any = {
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.textBlockWithLinks],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.html.text-block-with-links.rich-text.0": Object {
          "context": "$.html.text-block-with-links.rich-text.0",
          "options": Object {
            "href": "https://example.com/a",
            "text": "a",
          },
        },
        "$.html.text-block-with-links.rich-text.1": Object {
          "context": "$.html.text-block-with-links.rich-text.1",
          "options": Object {
            "href": "https://example.com/b",
            "text": "b",
          },
        },
        "$.html.text-block-with-links.rich-text.2": Object {
          "context": "$.html.text-block-with-links.rich-text.2",
          "options": Object {
            "href": "https://example.com/c",
            "text": "c",
          },
        },
        "$.plain.text-block-with-links.rich-text.0": Object {
          "context": "$.plain.text-block-with-links.rich-text.0",
          "options": Object {
            "href": "https://example.com/a",
            "text": "a",
          },
        },
        "$.plain.text-block-with-links.rich-text.1": Object {
          "context": "$.plain.text-block-with-links.rich-text.1",
          "options": Object {
            "href": "https://example.com/b",
            "text": "b",
          },
        },
        "$.plain.text-block-with-links.rich-text.2": Object {
          "context": "$.plain.text-block-with-links.rich-text.2",
          "options": Object {
            "href": "https://example.com/c",
            "text": "c",
          },
        },
      }
    `);
  });

  it("should return links from header and footer in line email template", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const params: any = {
      emailTemplateConfig: {
        footerLinks: {
          facebook: "https://fb.me/trycourier",
        },
        footerText: (fixtures.json.emailFooterText as unknown) as Value,
        headerLogoAlign: "left",
        headerLogoHref: "https://courier.com",
        headerLogoSrc:
          "https://s3.amazonaws.com/backend-production-librarybucket-1izigk5lryla9/c8fa99b7-d0d8-4225-8825-5ef259542665/1572288920322_logo.png",
        templateName: "line",
        topBarColor: "#9D3789",
      },
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.textBlockWithLinks],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.html.email-footer.facebook": Object {
          "context": "$.html.email-footer.facebook",
          "options": Object {
            "href": "https://fb.me/trycourier",
          },
        },
        "$.html.email-footer.rich-text.0": Object {
          "context": "$.html.email-footer.rich-text.0",
          "options": Object {
            "href": "https://courier.com/unsubscribe",
            "text": "unsubscribe",
          },
        },
        "$.html.email-header.logo": Object {
          "context": "$.html.email-header.logo",
          "options": Object {
            "href": "https://courier.com",
          },
        },
        "$.html.text-block-with-links.rich-text.0": Object {
          "context": "$.html.text-block-with-links.rich-text.0",
          "options": Object {
            "href": "https://example.com/a",
            "text": "a",
          },
        },
        "$.html.text-block-with-links.rich-text.1": Object {
          "context": "$.html.text-block-with-links.rich-text.1",
          "options": Object {
            "href": "https://example.com/b",
            "text": "b",
          },
        },
        "$.html.text-block-with-links.rich-text.2": Object {
          "context": "$.html.text-block-with-links.rich-text.2",
          "options": Object {
            "href": "https://example.com/c",
            "text": "c",
          },
        },
        "$.plain.text-block-with-links.rich-text.0": Object {
          "context": "$.plain.text-block-with-links.rich-text.0",
          "options": Object {
            "href": "https://example.com/a",
            "text": "a",
          },
        },
        "$.plain.text-block-with-links.rich-text.1": Object {
          "context": "$.plain.text-block-with-links.rich-text.1",
          "options": Object {
            "href": "https://example.com/b",
            "text": "b",
          },
        },
        "$.plain.text-block-with-links.rich-text.2": Object {
          "context": "$.plain.text-block-with-links.rich-text.2",
          "options": Object {
            "href": "https://example.com/c",
            "text": "c",
          },
        },
      }
    `);
  });

  it("should detect links in an action block", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const params: any = {
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.actionBlock],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.html.action-block.action": Object {
          "context": "$.html.action-block.action",
          "options": Object {
            "href": "https://www.courier.com",
            "text": "Learn More",
          },
        },
        "$.plain.action-block.action": Object {
          "context": "$.plain.action-block.action",
          "options": Object {
            "href": "https://www.courier.com",
            "text": "Learn More",
          },
        },
      }
    `);
  });

  it("should detect links using variables in an action block", () => {
    const profile = {};
    const variableData = {
      data: {
        cta: "Sign up now!",
        url: "https://www.courier.com/register",
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
    const params: any = {
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.actionBlockWithVariables],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.html.action-block.action": Object {
          "context": "$.html.action-block.action",
          "options": Object {
            "href": "https://www.courier.com/register",
            "text": "Sign up now!",
          },
        },
        "$.plain.action-block.action": Object {
          "context": "$.plain.action-block.action",
          "options": Object {
            "href": "https://www.courier.com/register",
            "text": "Sign up now!",
          },
        },
      }
    `);
  });

  it("should detect links in an action link block", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const params: any = {
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.actionLinkBlock],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.html.action-link-block.action": Object {
          "context": "$.html.action-link-block.action",
          "options": Object {
            "href": "https://www.courier.com",
            "text": "Learn More",
          },
        },
        "$.plain.action-link-block.action": Object {
          "context": "$.plain.action-link-block.action",
          "options": Object {
            "href": "https://www.courier.com",
            "text": "Learn More",
          },
        },
      }
    `);
  });

  it("should discover links in a list block", () => {
    const profile = {};
    const variableData = {
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
    const params: any = {
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.listBlockWithLinks],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.html.list-block.item.0.rich-text.0": Object {
          "context": "$.html.list-block.item.0.rich-text.0",
          "options": Object {
            "href": "https://example.com/a",
            "text": "a",
          },
        },
        "$.html.list-block.item.1.rich-text.0": Object {
          "context": "$.html.list-block.item.1.rich-text.0",
          "options": Object {
            "href": "https://example.com/b",
            "text": "b",
          },
        },
        "$.html.list-block.item.2.rich-text.0": Object {
          "context": "$.html.list-block.item.2.rich-text.0",
          "options": Object {
            "href": "https://example.com/c",
            "text": "c",
          },
        },
        "$.plain.list-block.item.0.rich-text.0": Object {
          "context": "$.plain.list-block.item.0.rich-text.0",
          "options": Object {
            "href": "https://example.com/a",
            "text": "a",
          },
        },
        "$.plain.list-block.item.1.rich-text.0": Object {
          "context": "$.plain.list-block.item.1.rich-text.0",
          "options": Object {
            "href": "https://example.com/b",
            "text": "b",
          },
        },
        "$.plain.list-block.item.2.rich-text.0": Object {
          "context": "$.plain.list-block.item.2.rich-text.0",
          "options": Object {
            "href": "https://example.com/c",
            "text": "c",
          },
        },
      }
    `);
  });

  it("should discover links in child lists in a list block", () => {
    const profile = {};
    const variableData = {
      data: {
        list: {
          childList: [{ value: "a" }, { value: "b" }, { value: "c" }],
          value: "parent",
        },
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
    const params: any = {
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.listBlockWithLinks],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.html.list-block.item.0.child-item.0.rich-text.0": Object {
          "context": "$.html.list-block.item.0.child-item.0.rich-text.0",
          "options": Object {
            "href": "https://example.com/a",
            "text": "a",
          },
        },
        "$.html.list-block.item.0.child-item.1.rich-text.0": Object {
          "context": "$.html.list-block.item.0.child-item.1.rich-text.0",
          "options": Object {
            "href": "https://example.com/b",
            "text": "b",
          },
        },
        "$.html.list-block.item.0.child-item.2.rich-text.0": Object {
          "context": "$.html.list-block.item.0.child-item.2.rich-text.0",
          "options": Object {
            "href": "https://example.com/c",
            "text": "c",
          },
        },
        "$.html.list-block.item.0.rich-text.0": Object {
          "context": "$.html.list-block.item.0.rich-text.0",
          "options": Object {
            "href": "https://example.com/parent",
            "text": "parent",
          },
        },
        "$.plain.list-block.item.0.child-item.0.rich-text.0": Object {
          "context": "$.plain.list-block.item.0.child-item.0.rich-text.0",
          "options": Object {
            "href": "https://example.com/a",
            "text": "a",
          },
        },
        "$.plain.list-block.item.0.child-item.1.rich-text.0": Object {
          "context": "$.plain.list-block.item.0.child-item.1.rich-text.0",
          "options": Object {
            "href": "https://example.com/b",
            "text": "b",
          },
        },
        "$.plain.list-block.item.0.child-item.2.rich-text.0": Object {
          "context": "$.plain.list-block.item.0.child-item.2.rich-text.0",
          "options": Object {
            "href": "https://example.com/c",
            "text": "c",
          },
        },
        "$.plain.list-block.item.0.rich-text.0": Object {
          "context": "$.plain.list-block.item.0.rich-text.0",
          "options": Object {
            "href": "https://example.com/parent",
            "text": "parent",
          },
        },
      }
    `);
  });

  it("should not discover links if using handlebars template", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const params: any = {
      emailTemplateConfig: {
        footerLinks: {
          facebook: "https://fb.me/trycourier",
        },
        footerText: (fixtures.json.emailFooterText as unknown) as Value,
        headerLogoAlign: "left",
        headerLogoHref: "https://courier.com",
        headerLogoSrc:
          "https://s3.amazonaws.com/backend-production-librarybucket-1izigk5lryla9/c8fa99b7-d0d8-4225-8825-5ef259542665/1572288920322_logo.png",
        templateName: "line",
        topBarColor: "#9D3789",
      },
      isUsingTemplateOverride: true,
      linkHandler,
      templateOverride:
        '<html><p>This is text with a <a href="https://example.com">link</a>.</p></html>',
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.textBlockWithLinks],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`Object {}`);
  });

  it("should discover links from slack", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const blocks = getBlocks(
      [fixtures.json.textBlockWithLink],
      linkHandler,
      variableHandler
    );

    slackLinkDiscovery(blocks);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.plain.text-block-with-link.rich-text.0": Object {
          "context": "$.plain.text-block-with-link.rich-text.0",
          "options": Object {
            "href": "https://example.com",
            "text": "link",
          },
        },
        "$.slack.text-block-with-link.rich-text.0": Object {
          "context": "$.slack.text-block-with-link.rich-text.0",
          "options": Object {
            "href": "https://example.com",
            "text": "link",
          },
        },
      }
    `);
  });

  it("should discover webhooks from slack action blocks", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true, true);
    const blocks = getBlocks(
      [fixtures.json.actionBlockWithWebhook],
      linkHandler,
      variableHandler
    );

    slackLinkDiscovery(blocks);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.slack.action-block.action": Object {
          "context": "$.slack.action-block.action",
          "options": Object {
            "actionId": "",
            "isWebhook": true,
            "text": "Learn More",
          },
        },
      }
    `);
  });

  it("should discover links from markdown", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const blocks = getBlocks(
      [fixtures.json.textBlockWithLink],
      linkHandler,
      variableHandler
    );

    mdLinkDiscovery(blocks);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.md.text-block-with-link.rich-text.0": Object {
          "context": "$.md.text-block-with-link.rich-text.0",
          "options": Object {
            "href": "https://example.com",
            "text": "link",
          },
        },
      }
    `);
  });

  it("should discover links from a template block", () => {
    const profile = {};
    const variableData = {
      data: {},
      event: "mock-event",
      profile,
      recipient: "mock-recipient",
    };
    const variableHandler = createVariableHandler({ value: variableData });
    const links = {};
    const linkHandler = createLinkHandler(links, true);
    const params: any = {
      linkHandler,
      variableHandler,
    };
    const blocks = getBlocks(
      [fixtures.json.templateBlockWithLink],
      linkHandler,
      variableHandler
    );

    emailLinkDiscovery(blocks, params);
    expect(links).toMatchInlineSnapshot(`
      Object {
        "$.html.template-block-with-link.template.0": Object {
          "context": "$.html.template-block-with-link.template.0",
          "options": Object {
            "href": "https://example.com",
          },
        },
      }
    `);
  });
});
