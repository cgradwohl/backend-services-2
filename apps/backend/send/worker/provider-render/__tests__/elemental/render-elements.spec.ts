import { ElementalIR } from "~/api/send/types";
import {
  elementalActionNodeToBlockWire,
  elementalDividerNodeToBlockWire,
  elementalImageNodeToBlockWire,
  elementalTextNodeToBlockWire,
  renderElements,
  elementsToBlockWires,
  elementalQuoteNodeToBlockWire,
  elementalHtmlNodeToBlockWire,
} from "~/send/worker/provider-render/elemental/render-elements";

describe("courier elemental rendering", () => {
  describe("renderElements", () => {
    it("should convert elements to hydrated blocks", () => {
      const blocks = renderElements([
        { type: "text", content: "Hello", visible: true, index: 0 },
      ]);
      expect(blocks).toBeDefined();
      expect(blocks?.length).toBe(1);
      expect(blocks?.[0]?.type).toBe("text");
    });

    it("should exclude meta elements", () => {
      const blocks = renderElements([
        { type: "meta", title: "Hello", visible: true, index: 0 },
      ]);
      expect(blocks).toBeDefined();
      expect(blocks?.length).toBe(0);
    });

    it("should throw for an invalid element type", () => {
      expect(() =>
        renderElements([
          {
            type: "im not a type",
            title: "Hello",
            visible: true,
            index: 0,
          } as any,
        ])
      ).toThrow();
    });
  });

  describe("elementsToBlockWires", () => {
    it("should handle all the elements", () => {
      const elements: ElementalIR = [
        { type: "text", content: "Hello", visible: true, index: 0 },
        {
          type: "image",
          src: "https://example.com/image.jpg",
          visible: true,
          index: 0,
        },
        {
          type: "action",
          content: "Click me",
          href: "https://example.com",
          visible: true,
          index: 0,
        },
        { type: "divider", visible: true, index: 0 },
        { type: "quote", content: "Hello", visible: true, index: 0 },
        { type: "html", content: "<p>hello</p>", visible: true, index: 0 },
      ];
      const blockWires = elementsToBlockWires(elements);

      expect(blockWires).toBeDefined();
      expect(blockWires?.length).toBe(6);
      expect(blockWires?.map((block) => block.type)).toEqual([
        "text",
        "image",
        "action",
        "divider",
        "quote",
        "template",
      ]);
    });

    it("should properly handle and flatten group elements", () => {
      const blocks = elementsToBlockWires([
        {
          type: "group",
          visible: true,
          index: 0,
          elements: [
            { type: "text", content: "Hello", visible: true, index: 0 },
          ],
        },
      ]);
      expect(blocks).toBeDefined();
      expect(blocks?.length).toBe(1);
      expect(blocks?.[0]?.type).toBe("text");
    });
  });

  describe("elementalTextNodeToBlockWire", () => {
    it("should convert elemental text node to block", () => {
      const block = elementalTextNodeToBlockWire({
        type: "text",
        content: "Hello",
        locales: {
          "eu-fr": {
            content: "bonjour",
          },
        },
      });

      expect(block).toBeDefined();
      expect(block?.id).toBeDefined();
      expect(block?.type).toBe("text");
      expect(
        JSON.parse(block?.config ?? "{}").value?.document?.nodes?.[0]
          ?.nodes?.[0]?.text
      ).toBe("Hello");
    });
  });

  describe("elementalQuoteNodeToBlockWire", () => {
    it("should convert elemental quote node to block", () => {
      const block = elementalQuoteNodeToBlockWire({
        type: "quote",
        content: "Hello",
        locales: {
          "eu-fr": {
            content: "bonjour",
          },
        },
      });

      expect(block).toBeDefined();
      expect(block?.id).toBeDefined();
      expect(block?.type).toBe("quote");
      expect(
        JSON.parse(block?.config ?? "{}").value?.document?.nodes?.[0]
          ?.nodes?.[0]?.text
      ).toBe("Hello");
    });
  });

  describe("elementalImageNodeToBlockWire", () => {
    it("should convert elemental image node to block", () => {
      const src = "https://example.com/image.jpg";
      const block = elementalImageNodeToBlockWire({
        type: "image",
        src,
      });

      expect(block).toBeDefined();
      expect(block.id).toBeDefined();
      expect(block.type).toBe("image");
      expect(JSON.parse(block.config).imagePath).toBe(src);
    });
  });

  describe("elementalActionNodeToBlockWire", () => {
    it("should convert elemental action node to block", () => {
      const block = elementalActionNodeToBlockWire({
        type: "action",
        href: "https://example.com/",
        content: "Hello",
      });

      expect(block).toBeDefined();
      expect(block.id).toBeDefined();
      expect(block.type).toBe("action");
      expect(JSON.parse(block.config).href).toBe("https://example.com/");
      expect(JSON.parse(block.config).text).toBe("Hello");
    });
  });

  describe("elementalDividerNodeToBlockWire", () => {
    it("should convert elemental divider node to block", () => {
      const block = elementalDividerNodeToBlockWire({
        type: "divider",
      });

      expect(block).toBeDefined();
      expect(block.id).toBeDefined();
      expect(block.type).toBe("divider");
    });
  });

  describe("elementalHtmlNodeToBlockWire", () => {
    it("should convert elemental divider node to block", () => {
      const block = elementalHtmlNodeToBlockWire({
        type: "html",
        content: "<p>Hello</p>",
      });

      expect(block).toBeDefined();
      expect(block.id).toBeDefined();
      expect(block.type).toBe("template");
    });
  });
});
