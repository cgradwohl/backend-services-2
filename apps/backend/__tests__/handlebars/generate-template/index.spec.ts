import getHandlebarsTemplate from "~/handlebars/template/generation/template";
import hydrateBlock from "~/lib/blocks/hydrate-slate-block";

import fixtures from "../__fixtures__";

const { blocks: blockFixtures } = fixtures;

const hydrateBlocks = (blocks: any[]) => {
  const allBlocks = blocks.map(hydrateBlock);
  const channelBlockIds = blocks.map((block) => block.id);
  return {
    allBlocks,
    blockIdsToRender: channelBlockIds,
  };
};

describe("generateTemplate", () => {
  it("should generate a handlebars template for a action block", () => {
    expect(
      getHandlebarsTemplate(hydrateBlocks(blockFixtures.actionBlock))
    ).toMatchInlineSnapshot(
      `"{{#>courier-template}}{{#courier-block \\"d918bf09-4789-4c57-b930-3c0a5919dcc1\\"}}{{#>action-block (params align=\\"center\\" backgroundColor=\\"#9D3789\\" href=\\"https://www.courier.com\\" style=\\"button\\")}}Click Here{{/action-block}}{{/courier-block}}{{/courier-template}}"`
    );
  });

  it("should generate a handlebars template for a block with conditionals", () => {
    expect(
      getHandlebarsTemplate(hydrateBlocks(blockFixtures.conditionalTextBlock))
    ).toMatchInlineSnapshot(
      `"{{#>courier-template}}{{#conditional (filter \\"data\\" \\"name\\" \\"EQUALS\\" \\"Luke\\" id=\\"3c82e5ed-35a1-41e1-a7c2-a21df01827fb\\") (filter \\"profile\\" \\"email\\" \\"EQUALS\\" \\"luke@courier.com\\" id=\\"f26cc2b4-8dd6-41a5-b927-2029adc1c213\\") behavior=\\"hide\\"}}{{#courier-block \\"3126b5bb-4560-4671-b265-235e7c8d5737\\"}}{{#>text-block}}Conditional text.{{/text-block}}{{/courier-block}}{{/conditional}}{{/courier-template}}"`
    );
  });

  it("should generate a handlebars template for a divider block", () => {
    expect(
      getHandlebarsTemplate(hydrateBlocks(blockFixtures.dividerBlock))
    ).toMatchInlineSnapshot(
      `"{{#>courier-template}}{{#courier-block \\"b9906749-c03b-483f-89f2-aedf1eae272d\\"}}{{>divider-block}}{{/courier-block}}{{/courier-template}}"`
    );
  });

  it("should generate a handlebars template for a image block", () => {
    expect(
      getHandlebarsTemplate(hydrateBlocks(blockFixtures.imageBlock))
    ).toMatchInlineSnapshot(
      `"{{#>courier-template}}{{#courier-block \\"a0c2d1d2-a9b6-4997-a6da-22762bd3b7b7\\"}}{{>image-block (params alt=\\"mountains\\" href=\\"https://example.com/mountains\\" src=\\"https://s3.amazonaws.com/backend-dev-librarybucket-a6n6jb55kc98/118c6491-a35d-4b81-b10b-d22f7d20da0c/1590005909939_green-mountains.jpg\\" width=\\"300px\\")}}{{/courier-block}}{{/courier-template}}"`
    );
  });

  it("should generate a handlebars template for a image block with vars", () => {
    expect(
      getHandlebarsTemplate(hydrateBlocks(blockFixtures.imageBlockWithVars))
    ).toMatchInlineSnapshot(
      `"{{#>courier-template}}{{#courier-block \\"a0c2d1d2-a9b6-4997-a6da-22762bd3b7b7\\"}}{{>image-block (params alt=(concat \\"Description: \\" (var \\"imageDescription\\")) href=(concat \\"https://example.com/\\" (var \\"imageLink\\")) src=(concat \\"http://example.com/\\" (var \\"imagePath\\")) width=\\"300px\\")}}{{/courier-block}}{{/courier-template}}"`
    );
  });

  it("should generate a handlebars template for a list block", () => {
    expect(
      getHandlebarsTemplate(hydrateBlocks(blockFixtures.listBlock))
    ).toMatchInlineSnapshot(
      `"{{#>courier-template}}{{#courier-block \\"f8eeeaca-ea90-4e25-a8fb-a2b5bf1ef7d3\\"}}{{#>list-block}}{{#each (get-list-items \\"characters\\")}}{{#>list-block-top (params background=\\"#4C4C4C\\")}}{{inline-var \\"name\\"}}{{/list-block-top}}{{/each}}{{/list-block}}{{/courier-block}}{{/courier-template}}"`
    );
  });

  it("should generate a handlebars template for a markdown block", () => {
    expect(
      getHandlebarsTemplate(hydrateBlocks(blockFixtures.markdownBlock))
    ).toMatchInlineSnapshot(
      `"{{#>courier-template}}{{#courier-block \\"0a45231e-83e6-42c1-a5cf-515d57906f60\\"}}{{#>markdown-block}}Hello {{{var \\"name\\"}}}. Get started with [markdown](http://daringfireball.net/projects/markdown/).{{/markdown-block}}{{/courier-block}}{{/courier-template}}"`
    );
  });

  it("should generate a handlebars template for a template block", () => {
    expect(getHandlebarsTemplate(hydrateBlocks(blockFixtures.templateBlock)))
      .toMatchInlineSnapshot(`
      "{{#>courier-template}}{{#courier-block \\"89d91144-7e1b-4c4f-9131-771db882d6a4\\"}}{{#>template-block}}<!-- block title -->
      <style>
        .template {
          color: blue;
        }
      </style>
      <div class=\\"template\\">Hello World</div>{{/template-block}}{{/courier-block}}{{/courier-template}}"
    `);
  });

  it("should generate a handlebars template for a text block", () => {
    expect(
      getHandlebarsTemplate(hydrateBlocks(blockFixtures.textBlock))
    ).toMatchInlineSnapshot(
      `"{{#>courier-template}}{{#courier-block \\"4648d06c-fbe1-41ac-a174-1337158730f0\\"}}{{#>text-block}}This is a text block{{/text-block}}{{/courier-block}}{{/courier-template}}"`
    );
  });
});
