import { ElementalNode } from "~/api/send/types";
import { generateIR } from "../../../elemental/evaluation/generate-ir";

describe("generateIR", () => {
  it("should fill index properties", () => {
    const elements: ElementalNode[] = [
      { type: "text", content: "Hello **world**" },
      {
        type: "group",
        elements: [{ type: "text", content: "Hello **world**" }],
      },
    ];

    const ir = generateIR(elements);
    expect(ir[0].type).toBe("text");
    expect(ir[0].index).toBe(0);
    expect(ir[1].type).toBe("group");
    expect(ir[1].index).toBe(1);
    expect((ir[1] as any)?.elements?.[0]?.type).toBe("text");
    expect((ir[1] as any)?.elements?.[0]?.index).toBe(2);
  });

  it("should filter comment nodes out", () => {
    const elements: ElementalNode[] = [
      { type: "text", content: "Hello **world**" },
      { type: "comment", comment: "Please ignore 🫥" },
    ];

    const ir = generateIR(elements);
    expect(ir.length).toBe(1);
    expect(ir[0].type).toBe("text");
    expect(ir[0].index).toBe(0);
  });
});
