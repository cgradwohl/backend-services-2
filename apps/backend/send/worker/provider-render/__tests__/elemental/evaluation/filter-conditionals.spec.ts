import { ElementalNodeIR } from "~/api/send/types";
import {
  filterConditionals,
  FilterConditionalsOpts,
} from "../../../elemental/evaluation/filter-conditionals";

describe("conditional evaluation", () => {
  describe("filterConditionals", () => {
    it("should filter out elements who's conditionals evaluate to false", () => {
      const el1: ElementalNodeIR = {
        type: "text",
        content: "Hello **world**",
        index: 0,
        visible: false,
        ref: "el1",
      };
      const el2: ElementalNodeIR = {
        type: "text",
        content: "Hello **wiggle**",
        index: 1,
        visible: true,
        if: "refs.el1.visible",
      };
      const el3: ElementalNodeIR = {
        type: "group",
        index: 2,
        visible: true,
        if: "!refs.el1.visible",
        elements: [
          {
            type: "text",
            content: "Hello **wobble**",
            index: 3,
            visible: true,
            if: "10 < 20",
          },
          el2,
        ],
      };
      const el4: ElementalNodeIR = {
        type: "text",
        content: "Hello **wiggle**",
        index: 4,
        visible: true,
        if: "data.isGoodDog",
      };
      const el5: ElementalNodeIR = {
        type: "text",
        content: "Hello **wiggle**",
        index: 5,
        visible: true,
        if: "profile.email.includes('@')",
      };
      const refs = { el1 };
      const filtered = filterConditionals({
        ir: [el2, el3, el4, el5],
        data: { isGoodDog: true },
        profile: { email: "drew@courier.com" },
        refs: refs,
      });
      expect(filtered).toEqual([
        {
          ...el3,
          elements: [el3.elements[0]],
        },
        el4,
        el5,
      ]);
    });

    it("should throw an error if the conditional returns a value that isn't a boolean", () => {
      const baseOpts: FilterConditionalsOpts = {
        ir: [],
        data: {},
        refs: {},
        profile: {},
      };

      const el1: ElementalNodeIR = {
        type: "text",
        content: "Hello **wiggle**",
        index: 1,
        visible: true,
        if: "undefined",
      };
      const el2: ElementalNodeIR = {
        type: "text",
        content: "Hello **wiggle**",
        index: 1,
        visible: true,
        if: "3",
      };
      const el3: ElementalNodeIR = {
        type: "text",
        content: "Hello **wiggle**",
        index: 1,
        visible: true,
        if: "{}",
      };
      expect(() => {
        filterConditionals({ ...baseOpts, ir: [el1] });
      }).toThrow("A conditional expression must evaluate to a boolean.");
      expect(() => {
        filterConditionals({ ...baseOpts, ir: [el2] });
      }).toThrow("A conditional expression must evaluate to a boolean.");
      expect(() => {
        filterConditionals({ ...baseOpts, ir: [el3] });
      }).toThrow("A conditional expression must evaluate to a boolean.");
    });
  });
});
