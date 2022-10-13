import { ElementalIR } from "~/api/send/types";
import { generateRefs } from "../../../elemental/evaluation/generate-refs";

describe("generateRefs", () => {
  it("should fill build out the correct ref table", () => {
    const ir: ElementalIR = [
      {
        type: "text",
        content: "Hello **world**",
        ref: "el1",
        index: 0,
        visible: true,
      },
      {
        type: "text",
        content: "Hello **world**",
        ref: "el2",
        index: 1,
        visible: true,
      },
      {
        type: "group",
        visible: true,
        elements: [
          {
            type: "text",
            content: "Hello **world**",
            ref: "el3",
            index: 3,
            visible: true,
          },
        ],
        index: 2,
      },
    ];

    const refs = generateRefs(ir);
    expect(refs.el1).toBeDefined();
    expect(refs.el1.ref).toBe("el1");
    expect(refs.el2).toBeDefined();
    expect(refs.el2.ref).toBe("el2");
    expect(refs.el3).toBeDefined();
    expect(refs.el3.ref).toBe("el3");
  });
});
