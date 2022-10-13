import mdToSlate from "~/lib/slate/md-to-slate";
import slateToMd from "~/lib/slate/slate-to-md";

it("will turn md into slate", () => {
  const md = `It's very +easy+ to make some words **bold** and other words *italic* with Markdown. You can even [*link* to Google!](http://google.com).  And {variables1} and {variables2}!`;
  const slate = mdToSlate(md);

  expect(slate).toMatchInlineSnapshot(`
    Object {
      "document": Object {
        "data": Object {},
        "nodes": Array [
          Object {
            "data": Object {},
            "nodes": Array [
              Object {
                "marks": Array [],
                "object": "text",
                "text": "It's very ",
              },
              Object {
                "marks": Array [
                  Object {
                    "data": undefined,
                    "type": "underlined",
                  },
                ],
                "object": "text",
                "text": "easy",
              },
              Object {
                "marks": Array [],
                "object": "text",
                "text": " to make some words ",
              },
              Object {
                "marks": Array [
                  Object {
                    "data": undefined,
                    "type": "bold",
                  },
                ],
                "object": "text",
                "text": "bold",
              },
              Object {
                "marks": Array [],
                "object": "text",
                "text": " and other words ",
              },
              Object {
                "marks": Array [
                  Object {
                    "data": undefined,
                    "type": "italic",
                  },
                ],
                "object": "text",
                "text": "italic",
              },
              Object {
                "marks": Array [],
                "object": "text",
                "text": " with Markdown. You can even ",
              },
              Object {
                "data": Object {
                  "href": "http://google.com",
                },
                "nodes": Array [
                  Object {
                    "marks": Array [
                      Object {
                        "data": undefined,
                        "type": "italic",
                      },
                    ],
                    "object": "text",
                    "text": "link",
                  },
                  Object {
                    "marks": Array [],
                    "object": "text",
                    "text": " to Google!",
                  },
                ],
                "object": "inline",
                "type": "link",
              },
              Object {
                "marks": Array [],
                "object": "text",
                "text": ".  And ",
              },
              Object {
                "data": Object {
                  "value": "variables1",
                },
                "nodes": Array [
                  Object {
                    "marks": Array [],
                    "object": "text",
                    "text": "{variables1}",
                  },
                ],
                "object": "inline",
                "type": "variable",
              },
              Object {
                "marks": Array [],
                "object": "text",
                "text": " and ",
              },
              Object {
                "data": Object {
                  "value": "variables2",
                },
                "nodes": Array [
                  Object {
                    "marks": Array [],
                    "object": "text",
                    "text": "{variables2}",
                  },
                ],
                "object": "inline",
                "type": "variable",
              },
              Object {
                "marks": Array [],
                "object": "text",
                "text": "!",
              },
            ],
            "object": "block",
            "type": "paragraph",
          },
        ],
        "object": "document",
      },
      "object": "value",
    }
  `);

  expect(slateToMd(slate)).toBe(md);
});
