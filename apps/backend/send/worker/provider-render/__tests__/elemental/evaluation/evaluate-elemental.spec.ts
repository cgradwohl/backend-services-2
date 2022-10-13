import { ElementalNode } from "~/api/send/types";
import { evaluateElemental } from "../../../elemental/evaluation";

describe("elemental evaluation", () => {
  it("should produce valid IR", () => {
    const elements: ElementalNode[] = [
      {
        type: "meta",
        title: "My Title",
      },
      {
        type: "text",
        content: "Hello **world**",
        if: "data.isGoodDog",
        ref: "el2",
      },
      {
        type: "text",
        content: "Hello **world**",
        if: "refs.el2.visible",
      },
      {
        type: "text",
        content: "Hello **world**",
        if: "!data.isGoodDog",
        ref: "el3",
      },
      {
        type: "group",
        if: "refs.el3.visible",
        elements: [{ type: "text", content: "Hello **world**" }],
      },
      {
        type: "action",
        href: "https://www.zuko.com",
        content: "The best boi",
      },
      {
        type: "group",
        elements: [
          {
            type: "action",
            content: "Click me",
            href: "https://example.com",
          },
          {
            type: "html",
            content:
              "<p>hello {{first_name}}</p><script>console.log('do evil')</script>",
          },
        ],
      },
      {
        type: "text",
        content: "Is this your email?: {{ profile.email }}",
      },
    ];

    const ir = evaluateElemental({
      elements,
      profile: { email: "drew@courier.com" },
      data: {
        isGoodDog: true,
        first_name: "Drew",
      },
      utm: {
        campaign: "campaña",
        content: "contenido",
        medium: "medio",
        source: "origen",
        term: "termino",
      },
    });

    expect(ir).toMatchInlineSnapshot(`
      Array [
        Object {
          "index": 0,
          "title": "My Title",
          "type": "meta",
          "visible": true,
        },
        Object {
          "content": "Hello **world**",
          "if": "data.isGoodDog",
          "index": 1,
          "ref": "el2",
          "type": "text",
          "visible": true,
        },
        Object {
          "content": "Hello **world**",
          "if": "refs.el2.visible",
          "index": 2,
          "type": "text",
          "visible": true,
        },
        Object {
          "content": "The best boi",
          "href": "https://www.zuko.com/?utm_campaign=campa%C3%B1a&utm_content=contenido&utm_medium=medio&utm_source=origen&utm_term=termino",
          "index": 5,
          "type": "action",
          "visible": true,
        },
        Object {
          "elements": Array [
            Object {
              "content": "Click me",
              "href": "https://example.com/?utm_campaign=campa%C3%B1a&utm_content=contenido&utm_medium=medio&utm_source=origen&utm_term=termino",
              "index": 7,
              "type": "action",
              "visible": true,
            },
            Object {
              "content": "<p>hello Drew</p>",
              "index": 8,
              "type": "html",
              "visible": true,
            },
          ],
          "index": 6,
          "type": "group",
          "visible": true,
        },
        Object {
          "content": "Is this your email?: drew@courier.com",
          "index": 7,
          "type": "text",
          "visible": true,
        },
      ]
    `);
  });
});
