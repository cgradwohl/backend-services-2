import { ElementalIR, ElementalNodeIR } from "~/api/send/types";
import {
  assertSemanticConformance,
  checkForUseBeforeDefined,
  checkForUseOfRefThatDoesNotExist,
  extractRefIdsFromString,
} from "../../../elemental/evaluation/assert-semantic-conformance";

describe("elemental semantic evaluation", () => {
  describe("performSemanticAnalysis", () => {
    it("should check for reference to ref that does not exist", () => {
      const elements: ElementalIR = [
        {
          type: "group",
          index: 0,
          visible: true,
          elements: [
            {
              type: "text",
              content: "Hello **world**",
              if: "refs.el2.visible",
              index: 1,
              visible: true,
            },
          ],
        },
      ];

      expect(() => assertSemanticConformance(elements, {})).toThrow();
    });

    it("should throw if an element references a lower element", () => {
      const referencedElement: ElementalNodeIR = {
        type: "text",
        content: "Hello **world**",
        index: 3,
        visible: true,
      };
      const elements: ElementalIR = [
        {
          type: "group",
          index: 0,
          visible: true,
          elements: [
            {
              type: "text",
              content: "Hello **world**",
              if: "refs.el2.visible",
              index: 2,
              visible: true,
            },
          ],
        },
        referencedElement,
      ];

      expect(() =>
        assertSemanticConformance(elements, { el2: referencedElement })
      ).toThrow();
    });

    it("should not throw given valid elements", () => {
      const elements: ElementalIR = [
        {
          type: "group",
          index: 0,
          visible: true,
          elements: [
            {
              type: "text",
              content: "Hello **world**",
              index: 1,
              visible: true,
            },
          ],
        },
      ];

      expect(() => assertSemanticConformance(elements, {})).not.toThrow();
    });
  });

  describe("checkForUseOfRefThatDoesNotExist", () => {
    it("should throw if passed refId does not exist in refTable", () => {
      expect(() =>
        checkForUseOfRefThatDoesNotExist("el1", { el2: {} as any })
      ).toThrow();
    });

    it("should not throw if passed refId exists in refTable", () => {
      expect(() =>
        checkForUseOfRefThatDoesNotExist("el1", { el1: {} as any })
      ).not.toThrow();
    });
  });

  describe("checkForUseBeforeDefined", () => {
    it("should throw if the ref'd element is used before it is defined", () => {
      const el1: ElementalNodeIR = {
        type: "text",
        content: "Hello **world**",
        index: 1,
        ref: "el1",
        visible: true,
      };
      expect(() => checkForUseBeforeDefined(0, el1)).toThrow();
    });
  });

  describe("extractRefIdsFromString", () => {
    it("should return an array of all refIds found in the string", () => {
      const str = "refs.el1 === refs.el2";
      const refIds = extractRefIdsFromString(str);
      expect(refIds).toEqual(["el1", "el2"]);
    });
  });
});
