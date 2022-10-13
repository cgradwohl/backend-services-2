import getProviderTemplate from "~/handlebars/template";
import getMSTeamsHandlebarsTemplate from "~/handlebars/template/msteams-with-adaptive-cards";

import hydrateBlock from "~/lib/blocks/hydrate-slate-block";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { Block } from "~/types.api";
// This config looks ugly but it exists as in the same format as we persist from Slate/Frontend
const markdownSlateBlocks = [
  {
    config:
      '{"backgroundColor":"transparent","value":{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"Hello ","marks":[]},{"object":"inline","type":"variable","data":{"value":"{}"},"nodes":[{"object":"text","text":"{recipient}","marks":[]}]},{"object":"text","text":".\\n\\nWelcome to the channel, here is link to get you ","marks":[]},{"object":"inline","type":"link","data":{"href":"https://docs.courier.com/docs","text":"start","disableLinkTracking":false},"nodes":[{"object":"text","text":"start","marks":[]}]},{"object":"text","text":".\\n\\nCheers,\\n","marks":[]},{"object":"inline","type":"variable","data":{"value":"{sender}"},"nodes":[{"object":"text","text":"{sender}","marks":[]}]},{"object":"text","text":"\\n","marks":[]}]}]}}}',
    id: "5fb524f2-f321-4ced-8579-3282c503f262",
    type: "text",
  },
];

const adaptiveCardBlocks: Block[] = [
  {
    config: {
      template:
        '{\n    "type": "AdaptiveCard",\n    "version": "1.0",\n    "body": [\n        {\n            "type": "Image",\n            "url": "http://adaptivecards.io/content/adaptive-card-50.png"\n        },\n        {\n            "type": "TextBlock",\n            "text": "Hello **Adaptive Cards!**"\n        }\n    ],\n    "actions": [\n        {\n            "type": "Action.OpenUrl",\n            "title": "Learn more",\n            "url": "http://adaptivecards.io"\n        },\n        {\n            "type": "Action.OpenUrl",\n            "title": "GitHub",\n            "url": "http://github.com/Microsoft/AdaptiveCards"\n        }\n    ]\n}',
    },
    id: "80cabe95-281f-4a61-9efb-871c85bc1288",
    type: "jsonnet",
  },
];
// has ${url}, ${greeetings}, and ${title} as dynamic fields
const adaptiveCardBlockWithDataSlots: Block[] = [
  {
    config: {
      template:
        '{\n    "type": "AdaptiveCard",\n    "version": "1.0",\n    "body": [\n        {\n            "type": "Image",\n            "url": "${url}"\n        },\n        {\n            "type": "TextBlock",\n            "text": "Hello **${greetings}**"\n        }\n    ],\n    "actions": [\n        {\n            "type": "Action.OpenUrl",\n            "title": "Learn more",\n            "url": "http://adaptivecards.io"\n        },\n        {\n            "type": "Action.OpenUrl",\n            "title": "${title}",\n            "url": "http://github.com/Microsoft/AdaptiveCards"\n        }\n    ]\n}',
    },
    id: "80cabe95-281f-4a61-9efb-871c85bc1288",
    type: "jsonnet",
  },
];

const hydrateBlocks = (blocks: any[]) => blocks.map(hydrateBlock);

describe("msteams template blocks", () => {
  it("should render markdown template", () => {
    const markdownBlock = hydrateBlocks(markdownSlateBlocks);
    const channelBlockIds = markdownBlock.map((block) => block.id);
    const config = {};

    const { msteamsRenderer } = getProviderTemplate({
      allBlocks: markdownBlock,
      config,
      channelBlockIds,
      provider: "msteam",
      renderOverrides: (template) => ({
        msteamsRenderer: () => getMSTeamsHandlebarsTemplate(template),
      }),
    });

    const msTeamRenderer = msteamsRenderer();

    /*
      Hello Argo.
      Welcome to the channel, here is link to get you [start](https://docs.courier.com/docs).
      Cheers,
      Suhas
    */
    const actualTemplate = msTeamRenderer.render(
      createVariableHandler({
        value: {
          data: {
            recipient: "Argo",
            sender: "Suhas",
          },
        },
      }).getScoped("data"),
      createLinkHandler({})
    );
    expect(actualTemplate).toMatchSnapshot();
  });

  it("should render static adpative card json template", () => {
    const channelBlockIds = adaptiveCardBlocks.map((block) => block.id);
    const { msteamsRenderer } = getProviderTemplate({
      allBlocks: adaptiveCardBlocks,
      config: {},
      channelBlockIds,
      provider: "msteam",
      renderOverrides: (template) => ({
        msteamsRenderer: () => getMSTeamsHandlebarsTemplate(template),
      }),
    });

    const msTeamRenderer = msteamsRenderer();

    const actualTemplate = msTeamRenderer.render(
      createVariableHandler({
        value: {},
      }).getScoped("data"),
      createLinkHandler({})
    );

    expect(actualTemplate).toMatchSnapshot();
  });

  it("should render dynamic adpative card json template", () => {
    const channelBlockIds = adaptiveCardBlockWithDataSlots.map(
      (block) => block.id
    );
    const { msteamsRenderer } = getProviderTemplate({
      allBlocks: adaptiveCardBlockWithDataSlots,
      config: {},
      channelBlockIds,
      provider: "msteam",
      renderOverrides: (template) => ({
        msteamsRenderer: () => getMSTeamsHandlebarsTemplate(template),
      }),
    });

    const msTeamRenderer = msteamsRenderer();

    const variableData = createVariableHandler({
      value: {
        data: {
          greetings: "Argo",
          title: "github",
          url: "https://github.com",
        },
      },
    }).getScoped("data");

    const actualTemplate = msTeamRenderer.render(
      variableData,
      createLinkHandler({})
    );

    expect(actualTemplate).toMatchSnapshot();
  });
});
