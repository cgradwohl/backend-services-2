import { applyBlockOverrides } from "~/lib/blocks/apply-overrides";
import { BlockWire } from "~/types.api";
import mockBlockConfig from "./mock-block-config.json";

describe("apply block overrides", () => {
  const mockBlocks: BlockWire[] = [
    {
      id: "mockBlockId",
      type: "text",
      config: JSON.stringify(mockBlockConfig),
    },
  ];

  it("should ignore overrides if they don't exist", () => {
    const overridenBlocks = applyBlockOverrides(mockBlocks);
    expect(overridenBlocks).toEqual(mockBlocks);
  });

  it("should apply config overrides", () => {
    const overridenBlocks = applyBlockOverrides(mockBlocks, {
      block_mockBlockId: {
        config: {
          align: "right",
        },
      },
    });

    const overriddenConfig = JSON.parse(overridenBlocks[0].config);
    expect(overriddenConfig.align).toBe("right");
  });

  it("should apply slate overrides from html", () => {
    const overridenBlocks = applyBlockOverrides(mockBlocks, {
      block_mockBlockId: {
        content: "hello world",
      },
    });

    const overriddenConfig = JSON.parse(overridenBlocks[0].config);
    expect(overriddenConfig.value).toMatchSnapshot();
  });

  it("should apply slate overrides from html and apply node data to matching nodes", () => {
    const overridenBlocks = applyBlockOverrides(mockBlocks, {
      block_mockBlockId: {
        content: '<highlight id="7">hello world</highlight>',
      },
    });

    const overriddenConfig = JSON.parse(overridenBlocks[0].config);
    expect(overriddenConfig.value).toMatchSnapshot();
  });
});
