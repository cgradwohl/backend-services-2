import {
  elementHasHbsSupportedField,
  evaluateHbsOfElement,
} from "../../../elemental/evaluation/evaluate-hbs";
import { generateIR } from "../../../elemental/evaluation/generate-ir";

describe("Elemental HBS", () => {
  describe("evaluateHbs", () => {
    it("should render a text element", () => {
      const ir = generateIR([{ type: "text", content: "Hello {{name}}" }]);
      const data = { name: "world" };
      const result = evaluateHbsOfElement(ir[0], data);
      expect((result as any).content).toBe("Hello world");
    });

    it("should render an action element", () => {
      const ir = generateIR([
        { type: "action", href: "/{{url}}", content: "Hello {{name}}" },
      ]);
      const data = { name: "world", url: "foo" };
      const result = evaluateHbsOfElement(ir[0], data);
      expect((result as any).href).toBe("/foo");
      expect((result as any).content).toBe("Hello world");
    });

    it("should render a quote element", () => {
      const ir = generateIR([{ type: "quote", content: "Hello {{name}}" }]);
      const data = { name: "world" };
      const result = evaluateHbsOfElement(ir[0], data);
      expect((result as any).content).toBe("Hello world");
    });

    it("should render the title of a meta element", () => {
      const ir = generateIR([{ type: "meta", title: "Hello {{name}}" }]);
      const data = { name: "world" };
      const result = evaluateHbsOfElement(ir[0], data);
      expect((result as any).title).toBe("Hello world");
    });

    it("should render the src of an image element", () => {
      const ir = generateIR([{ type: "image", src: "/my-images/{{path}}" }]);
      const data = { path: "foo" };
      const result = evaluateHbsOfElement(ir[0], data);
      expect((result as any).src).toBe("/my-images/foo");
    });
  });

  describe("elementHasHbsSupportedField", () => {
    it("should return true when an element has a supported field", () => {
      expect(elementHasHbsSupportedField({ type: "text", content: "" })).toBe(
        true
      );
      expect(
        elementHasHbsSupportedField({ type: "action", href: "", content: "" })
      ).toBe(true);
      expect(elementHasHbsSupportedField({ type: "image", src: "" })).toBe(
        true
      );
    });

    it("should return false when an element doesn't have a supported field", () => {
      expect(elementHasHbsSupportedField({ type: "group", elements: [] })).toBe(
        false
      );
    });
  });
});
