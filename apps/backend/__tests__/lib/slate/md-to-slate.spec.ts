import serialize from "~/lib/slate/md-to-slate";

describe("marks", () => {
  [
    ["bold", "**"],
    ["bold", "__"],
    ["code", "`"],
    ["italic", "*"],
    ["italic", "_"],
    ["underlined", "+"],
  ].forEach(([name, mark]) => {
    it(`should serialize a ${name} mark`, () => {
      expect(serialize(`${mark}content${mark}`)).toStrictEqual({
        document: {
          data: {},
          nodes: [
            {
              data: {},
              nodes: [
                {
                  marks: [
                    {
                      data: undefined,
                      type: name,
                    },
                  ],
                  object: "text",
                  text: "content",
                },
              ],
              object: "block",
              type: "paragraph",
            },
          ],
          object: "document",
        },
        object: "value",
      });
    });
  });
});

describe("inline", () => {
  describe("links", () => {
    it("should serialize anchor links", () => {
      expect(serialize("[Courier](https://www.trycourier.com)")).toStrictEqual({
        document: {
          data: {},
          nodes: [
            {
              data: {},
              nodes: [
                {
                  data: {
                    href: "https://www.trycourier.com",
                  },
                  nodes: [
                    {
                      marks: [],
                      object: "text",
                      text: "Courier",
                    },
                  ],
                  object: "inline",
                  type: "link",
                },
              ],
              object: "block",
              type: "paragraph",
            },
          ],
          object: "document",
        },
        object: "value",
      });
    });
  });

  describe("variable", () => {
    it("should serialize a variable", () => {
      const markdown = "{name}";
      expect(serialize(markdown)).toStrictEqual({
        document: {
          data: {},
          nodes: [
            {
              data: {},
              nodes: [
                {
                  data: {
                    value: "name",
                  },
                  nodes: [
                    {
                      marks: [],
                      object: "text",
                      text: "{name}",
                    },
                  ],
                  object: "inline",
                  type: "variable",
                },
              ],
              object: "block",
              type: "paragraph",
            },
          ],
          object: "document",
        },
        object: "value",
      });
    });
  });
});

describe("blocks", () => {
  describe("heading", () => {
    ["one", "two", "three", "four", "five", "six"].forEach((heading, idx) => {
      it(`should serialize heading-${heading}`, () => {
        const markdown = `${"#".repeat(idx + 1)} content`;

        expect(serialize(markdown)).toStrictEqual({
          document: {
            data: {},
            nodes: [
              {
                data: {},
                nodes: [
                  {
                    marks: [],
                    object: "text",
                    text: "content",
                  },
                ],
                object: "block",
                type: `heading-${heading}`,
              },
            ],
            object: "document",
          },
          object: "value",
        });
      });
    });
  });

  describe("list", () => {
    it("should serialize a list", () => {
      const markdown = `- item 1\n- item 2\n- item 3`;
      expect(serialize(markdown)).toStrictEqual({
        document: {
          data: {},
          nodes: [
            {
              data: {},
              nodes: [
                {
                  data: {},
                  nodes: [
                    {
                      marks: [],
                      object: "text",
                      text: "item 1",
                    },
                  ],
                  object: "block",
                  type: "list-item",
                },
                {
                  data: {},
                  nodes: [
                    {
                      marks: [],
                      object: "text",
                      text: "item 2",
                    },
                  ],
                  object: "block",
                  type: "list-item",
                },
                {
                  data: {},
                  nodes: [
                    {
                      marks: [],
                      object: "text",
                      text: "item 3",
                    },
                  ],
                  object: "block",
                  type: "list-item",
                },
              ],
              object: "block",
              type: `bulleted-list`,
            },
          ],
          object: "document",
        },
        object: "value",
      });
    });
  });
});
