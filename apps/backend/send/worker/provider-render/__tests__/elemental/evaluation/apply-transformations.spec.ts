import { ElementalHtmlNode } from "~/api/send/types";
import {
  applyTransformations,
  transformHtml,
} from "../../../elemental/evaluation/apply-transformations";
import { generateIR } from "../../../elemental/evaluation/generate-ir";

describe("apply elemental transformations", () => {
  describe("applyTransformations", () => {
    it("should transform a complex elemental doc", () => {
      const ir = generateIR([
        {
          type: "action",
          href: "https://www.google.com",
          content: "the goog",
        },
        {
          type: "group",
          elements: [
            {
              type: "action",
              href: "https://www.facebook.com/profile/{{facebook_id}}",
              content: "the facebook",
            },
            {
              type: "html",
              content:
                "<p>Hello {{first_name}}</p><script>console.log('do evil 😈')</script>",
            },
            {
              type: "text",
              content: "Is this your email?: {{ profile.email }}",
            },
          ],
        },
      ]);

      const utm = {
        campaign: "campaña",
        content: "contenido",
        medium: "medio",
        source: "origen",
        term: "termino",
      };

      const data = {
        first_name: "John",
        facebook_id: "12345",
      };

      const profile = { email: "drew@courier.com" };

      expect(applyTransformations({ ir, data, utm, profile }))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "content": "the goog",
            "href": "https://www.google.com/?utm_campaign=campa%C3%B1a&utm_content=contenido&utm_medium=medio&utm_source=origen&utm_term=termino",
            "index": 0,
            "type": "action",
            "visible": true,
          },
          Object {
            "elements": Array [
              Object {
                "content": "the facebook",
                "href": "https://www.facebook.com/profile/12345?utm_campaign=campa%C3%B1a&utm_content=contenido&utm_medium=medio&utm_source=origen&utm_term=termino",
                "index": 2,
                "type": "action",
                "visible": true,
              },
              Object {
                "content": "<p>Hello John</p>",
                "index": 3,
                "type": "html",
                "visible": true,
              },
              Object {
                "content": "Is this your email?: drew@courier.com",
                "index": 4,
                "type": "text",
                "visible": true,
              },
            ],
            "index": 1,
            "type": "group",
            "visible": true,
          },
        ]
      `);
    });
  });

  describe("transformHtml", () => {
    it("should sanitize html while allowing styles", () => {
      const ir = generateIR([
        {
          type: "html",
          content: `
            <style>
              .foo {
                color: red;
              }
            </style>
            <p class=".foo" style="background-color: blue">Hello</p>
            <script>console.log('do evil 😈')</script>
          `,
        },
      ]);

      expect((transformHtml(ir[0]) as ElementalHtmlNode).content.trim())
        .toMatchInlineSnapshot(`
        "<style>
                      .foo {
                        color: red;
                      }
                    </style>
                    <p style=\\"background-color: blue\\" class=\\".foo\\">Hello</p>"
      `);
    });
  });
});
