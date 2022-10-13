import slateToMdElemental from "~/lib/slate/slate-to-md-elemental-content";

describe("marks", () => {
  [
    ["bold", "**"],
    ["code", "`"],
    ["italic", "*"],
    ["underlined", "+"],
  ].forEach(([name, mark]) => {
    it(`should serialize a ${name} mark`, () => {
      const json = {
        document: {
          data: {},
          nodes: [
            {
              data: {},
              nodes: [
                {
                  marks: [
                    {
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
      };
      const markdown = `${mark}content${mark}`;

      expect(slateToMdElemental(json)).toEqual(markdown);
    });
  });
});

describe("inline", () => {
  describe("links", () => {
    it("should serialize anchor links", () => {
      const json = {
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
      };
      const markdown = "[Courier](https://www.trycourier.com)";
      expect(slateToMdElemental(json)).toEqual(markdown);
    });
  });

  describe("variable", () => {
    it("should serialize a variable", () => {
      const json = {
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
      };
      const markdown = "{{name}}";

      expect(slateToMdElemental(json)).toEqual(markdown);
    });
  });
});

describe("blocks", () => {
  describe("heading", () => {
    ["one", "two", "three", "four", "five", "six"].forEach((heading, idx) => {
      it(`should serialize heading-${heading}`, () => {
        const markdown = `${"#".repeat(idx + 1)} content`;
        const json = {
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
        };

        expect(slateToMdElemental(json)).toEqual(markdown);
      });
    });
  });
});

describe("list", () => {
  it("should serialize a list", () => {
    const json = {
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
    };
    const markdown = `- item 1\n- item 2\n- item 3`;
    expect(slateToMdElemental(json)).toEqual(markdown);
  });
});
