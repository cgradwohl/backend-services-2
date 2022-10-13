import createVariableHandler from "~/lib/variable-handler";
import { compileElementalContentMessage } from "../../elemental";

describe("compileElemental", () => {
  it("should compile a standard courier elemental template", () => {
    const elemental = compileElementalContentMessage({
      content: {
        version: "2022-01-01",
        elements: [
          {
            type: "meta",
            title: "test title",
          },
          {
            type: "text",
            content: "test body",
          },
        ],
      },
      profile: {},
      data: {},
      variableHandler: createVariableHandler({ value: { data: {} } }),
    });

    expect(elemental).toBeDefined();
    expect(elemental.title).toBe("test title");
    expect(elemental.renderedBlocks[0].type).toBe("text");
  });

  it("should compile a content message with template sugar", () => {
    const elemental = compileElementalContentMessage({
      content: {
        title: "test title",
        body: "test body",
      },
      data: {},
      profile: {},
      variableHandler: createVariableHandler({ value: { data: {} } }),
    });

    expect(elemental).toBeDefined();
    expect(elemental.title).toBe("test title");
    expect(elemental.renderedBlocks[0].type).toBe("text");
  });
});
