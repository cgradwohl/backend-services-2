import { ElementalGroupNodeIR, ElementalNodeIR } from "~/api/send/types";
import {
  elementIsRef,
  updateVisibility,
} from "../../../elemental/evaluation/update-visibility";

describe("updateVisibility", () => {
  it("should mark refs who are no longer visible as visible false", () => {
    const el1: ElementalNodeIR = {
      type: "text",
      content: "Hello **world**",
      visible: true,
      ref: "el1",
      index: 0,
    };
    const el2: ElementalNodeIR = {
      type: "text",
      content: "Hello **world**",
      visible: true,
      if: "refs.el1.visible",
      ref: "el2",
      index: 1,
    };
    const refs = { el1, el2 };
    const ir = updateVisibility([el1], refs);
    expect(el2.visible).toBe(false);
    expect(el1.visible).toBe(true);
    expect(ir).toEqual([el1]);
  });
});

describe("elementIsRef", () => {
  it("should return true if the passed element either is the ref or contains it", () => {
    const el1: ElementalNodeIR = {
      type: "text",
      content: "Hello **world**",
      visible: true,
      ref: "el1",
      index: 0,
    };
    const el2: ElementalNodeIR = {
      type: "text",
      content: "Hello **world**",
      visible: true,
      if: "refs.el1.visible",
      ref: "el2",
      index: 1,
    };
    const el3: ElementalGroupNodeIR = {
      type: "group",
      visible: true,
      index: 2,
      elements: [el2],
    };

    expect(elementIsRef(el1, el1.ref)).toBe(true);
    expect(elementIsRef(el3, el2.ref)).toBe(true);
    expect(elementIsRef(el3, el1.ref)).toBe(false);
  });
});
