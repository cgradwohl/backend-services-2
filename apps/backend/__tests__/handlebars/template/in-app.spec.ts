import uuid from "uuid";
import getProviderTemplate from "~/handlebars/template";
import createLinkHandler from "~/lib/link-handler";
import createVariableHandler from "~/lib/variable-handler";
import { Block } from "~/types.api";
import getTemplates from "~/lib/templates/in-app";

import { Value } from "slate";
import { TemplateConfig } from "~/handlebars/template/types";

const mockTextBlock: Block = {
  type: "text",
  id: uuid.v4(),
  config: {
    value: Value.fromJSON(
      JSON.parse(
        '{"object":"value","document":{"object":"document","data":{},"nodes":[{"object":"block","type":"line","data":{},"nodes":[{"object":"text","text":"","marks":[]},{"object":"inline","type":"variable","data":{"value":"{name}"},"nodes":[{"object":"text","text":"{name}","marks":[]}]},{"object":"text","text":"","marks":[]}]}]}}'
      )
    ),
  },
};

const mockActionBlock: Block = {
  type: "action",
  id: uuid.v4(),
  config: {
    backgroundColor: "red",
    style: "button",
    align: "left",
    href: "https://www.courier.com",
    text: "Click Me",
  },
};

describe("in-app template", () => {
  it("should render text block", () => {
    const templateConfig: TemplateConfig = {
      push: {
        icon: undefined,
        clickAction: undefined,
        title: "hello {name}",
      },
    };

    const templates = getProviderTemplate({
      allBlocks: [mockTextBlock, mockActionBlock],
      channelBlockIds: [mockTextBlock.id, mockActionBlock.id],
      config: templateConfig,
    });

    const inappTemplates = getTemplates(templates, templateConfig);

    const data = {
      data: {
        name: "MockName",
      },
      profile: {},
    };
    const variableHandler = createVariableHandler({ value: data }).getScoped(
      "data"
    );
    const renderedBlocks = inappTemplates.blocks.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedBlocks).toEqual([
      {
        text: "MockName",
        type: "text",
      },
      {
        text: "Click Me",
        type: "action",
        url: "https://www.courier.com",
      },
    ]);

    const renderedTitle = inappTemplates.title.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedTitle).toEqual("hello MockName");
  });

  it("should render inbox title slot", () => {
    const templateConfig: TemplateConfig = {
      channel: "inbox",
      slots: {
        title: [mockTextBlock.id],
      },
    };

    const templates = getProviderTemplate({
      allBlocks: [mockTextBlock, mockActionBlock],
      channelBlockIds: [mockActionBlock.id],
      config: templateConfig,
    });

    const inappTemplates = getTemplates(templates, templateConfig);

    const data = {
      data: {
        name: "My Title!",
      },
      profile: {},
    };
    const variableHandler = createVariableHandler({ value: data }).getScoped(
      "data"
    );

    const renderedElemental = inappTemplates.elemental.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedElemental).toEqual([
      {
        align: "left",
        background_color: "red",
        content: "Click Me",
        href: "https://www.courier.com",
        type: "action",
      },
    ]);

    const renderedTitle = inappTemplates.title.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedTitle).toEqual("My Title!");
  });

  it("should render inbox preview slot by using first text block in body", () => {
    const templateConfig: TemplateConfig = {
      channel: "inbox",
    };

    const templates = getProviderTemplate({
      allBlocks: [mockTextBlock, mockActionBlock],
      channelBlockIds: [mockTextBlock.id, mockActionBlock.id],
      config: templateConfig,
    });

    const inappTemplates = getTemplates(templates, templateConfig);

    const data = {
      data: {
        name: "My Text",
      },
      profile: {},
    };
    const variableHandler = createVariableHandler({ value: data }).getScoped(
      "data"
    );
    const renderedElemental = inappTemplates.elemental.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedElemental).toEqual([
      {
        content: "My Text",
        type: "text",
      },
      {
        align: "left",
        background_color: "red",
        content: "Click Me",
        href: "https://www.courier.com",
        type: "action",
      },
    ]);

    const renderedPreview = inappTemplates.preview.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedPreview).toEqual("My Text");
  });

  it("should render inbox preview slot by using an explicit text block", () => {
    const templateConfig: TemplateConfig = {
      channel: "inbox",
      slots: {
        preview: [mockTextBlock.id],
      },
    };

    const templates = getProviderTemplate({
      allBlocks: [mockTextBlock, mockActionBlock],
      channelBlockIds: [mockActionBlock.id],
      config: templateConfig,
    });

    const inappTemplates = getTemplates(templates, templateConfig);

    const data = {
      data: {
        name: "My Text",
      },
      profile: {},
    };
    const variableHandler = createVariableHandler({ value: data }).getScoped(
      "data"
    );
    const renderedElemental = inappTemplates.elemental.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedElemental).toEqual([
      {
        align: "left",
        background_color: "red",
        content: "Click Me",
        href: "https://www.courier.com",
        type: "action",
      },
    ]);

    const renderedPreview = inappTemplates.preview.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedPreview).toEqual("My Text");
  });

  it("should render inbox action slot by using an explicit text block", () => {
    const templateConfig: TemplateConfig = {
      channel: "inbox",
      slots: {
        actions: [mockActionBlock.id],
      },
    };

    const templates = getProviderTemplate({
      allBlocks: [mockTextBlock, mockActionBlock],
      channelBlockIds: [mockTextBlock.id],
      config: templateConfig,
    });

    const inappTemplates = getTemplates(templates, templateConfig);

    const data = {
      data: {
        name: "My Text",
      },
      profile: {},
    };
    const variableHandler = createVariableHandler({ value: data }).getScoped(
      "data"
    );
    const renderedElemental = inappTemplates.elemental.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedElemental).toEqual([
      {
        content: "My Text",
        type: "text",
      },
    ]);

    const renderedActions = inappTemplates.actions.render(
      variableHandler,
      createLinkHandler({})
    );

    expect(renderedActions).toEqual([
      {
        align: "left",
        background_color: "red",
        content: "Click Me",
        href: "https://www.courier.com",
        type: "action",
      },
    ]);
  });
});
