import { generateIR } from "../../../elemental/evaluation/generate-ir";
import {
  evaluateLoops,
  evaluateLoop,
  assertIsValidLoopResult,
} from "../../../elemental/evaluation/loop-evaluation";

describe("loop evaluation", () => {
  describe("evaluateLoops", () => {
    it("should evaluate a basic loop", () => {
      const ir = generateIR([
        {
          type: "group",
          elements: [
            {
              type: "text",
              content: "{{ add $.index 1 }}. Hello {{ $.item }}!",
              loop: "data.names",
            },
          ],
        },
      ]);
      const data = {
        names: ["Drew", "Chris", "Suhas"],
      };
      const evaluated = evaluateLoops({ ir, data, refs: {}, profile: {} });
      expect(evaluated).toMatchSnapshot();
    });

    it("should evaluate a complex loop with groups and recursion", () => {
      const ir = generateIR([
        {
          type: "group",
          loop: "data.products.desserts",
          elements: [
            {
              type: "text",
              content: "# Name: {{$.item.name}}, Price: {{$.item.price}}",
            },
            {
              type: "text",
              content: "Flavors:",
            },
            {
              type: "text",
              content: "- {{$.item}}",
              loop: "$.item.flavors",
            },
          ],
        },
      ]);

      const data = {
        products: {
          desserts: [
            {
              name: "Ice Cream",
              price: "$9.00",
              flavors: ["Chocolate", "Vanilla"],
            },
            {
              name: "Cake",
              price: "$9.00",
              flavors: ["German Chocolate", "Cheesecake"],
            },
          ],
        },
      };

      const evaluated = evaluateLoops({ ir, data, refs: {}, profile: {} });
      expect(evaluated).toMatchSnapshot();
    });

    it("should interpolate variables outside of content", () => {
      const ir = generateIR([
        {
          type: "action",
          content: "View {{ $.item.name }}",
          href: "{{$.item.href}}",
          loop: "data.products",
        },
      ]);
      const data = {
        products: [
          {
            name: "Cheese",
            href: "https://www.cheese.com",
          },
          {
            name: "Bread",
            href: "https://www.bread.com",
          },
        ],
      };
      const evaluated: any = evaluateLoops({ ir, data, refs: {}, profile: {} });
      expect(evaluated[0].content).toBe("View Cheese");
      expect(evaluated[0].href).toBe("https://www.cheese.com");
      expect(evaluated[1].content).toBe("View Bread");
      expect(evaluated[1].href).toBe("https://www.bread.com");
    });
  });

  describe("evaluateLoop", () => {
    it("should evaluate loops", () => {
      const data = {
        products: [
          { name: "Ice Cream!", price: 1.99 },
          { name: "Cake!", price: 2.99 },
          { name: "Cleveland (The City) -_-", price: 0.99 },
        ],
      };
      const loop = "data.products";

      const evaluated = evaluateLoop({ refs: {}, data, loop, profile: {} });
      expect(evaluated.length).toBe(3);
      expect(evaluated).toEqual(data.products);
    });

    it("should throw when loop does not return array", () => {
      const data = {
        boop: 1,
      };
      const loop = "data.boop";
      expect(() =>
        evaluateLoop({ refs: {}, data, loop, profile: {} })
      ).toThrow();
    });
  });

  describe("assertIsValidLoopResult", () => {
    it("should throw in typeof loopResult is not an array", () => {
      const loopResult = {};
      expect(() => {
        assertIsValidLoopResult(loopResult);
      }).toThrow();
    });

    it("should not throw in typeof loopResult is an array", () => {
      const loopResult = [];
      expect(() => {
        assertIsValidLoopResult(loopResult);
      }).not.toThrow();
    });
  });
});
