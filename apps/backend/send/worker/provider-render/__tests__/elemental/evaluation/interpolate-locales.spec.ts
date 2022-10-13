import { generateIR } from "../../../elemental/evaluation/generate-ir";
import { interpolateLocales } from "../../../elemental/evaluation/interpolate-locales";

describe("interpolate elemental locales", () => {
  it("should replace content with localized content", () => {
    const ir = generateIR([
      {
        type: "text",
        content: "Hello {{name}}",
        locales: { "eu-fr": { content: "Bonjour {{name}}" } },
      },
    ]);

    const result = interpolateLocales({ ir, locale: "eu-fr" });
    expect((result[0] as any)?.content).toBe("Bonjour {{name}}");
  });

  it("should replace title with localized title", () => {
    const ir = generateIR([
      {
        type: "meta",
        title: "Hello {{name}}",
        locales: { "eu-fr": { title: "Bonjour {{name}}" } },
      },
    ]);

    const result = interpolateLocales({ ir, locale: "eu-fr" });
    expect((result[0] as any)?.title).toBe("Bonjour {{name}}");
  });

  it("should replace href with localized action", () => {
    const ir = generateIR([
      {
        type: "action",
        content: "Hello {{name}}",
        href: "www.example.com",
        locales: { "eu-fr": { href: "fr.example.com" } },
      },
    ]);

    const result = interpolateLocales({ ir, locale: "eu-fr" });
    expect((result[0] as any)?.href).toBe("fr.example.com");
  });

  it("should replace content with localized content in nested elements", () => {
    const ir = generateIR([
      {
        type: "group",
        elements: [
          {
            type: "text",
            content: "Hello {{name}}",
            locales: { "eu-fr": { content: "Bonjour {{name}}" } },
          },
        ],
      },
    ]);

    const result = interpolateLocales({ ir, locale: "eu-fr" });
    expect((result[0] as any).elements?.[0]?.content).toBe("Bonjour {{name}}");
  });

  it("should replace elements with localized elements in group element", () => {
    const ir = generateIR([
      {
        type: "group",
        elements: [
          {
            type: "text",
            content: "Hello {{name}}",
          },
        ],
        locales: {
          "eu-fr": {
            elements: [
              {
                type: "text",
                content: "Bonjour {{name}}",
              },
            ],
          },
        },
      },
    ]);

    const result = interpolateLocales({ ir, locale: "eu-fr" });
    expect((result[0] as any).elements?.[0]?.content).toBe("Bonjour {{name}}");
  });

  it("should not replace content if no matching locale exist", () => {
    const ir = generateIR([
      {
        type: "text",
        content: "Hello {{name}}",
        locales: { "eu-fr": { content: "Bonjour {{name}}" } },
      },
    ]);

    const result = interpolateLocales({ ir, locale: "en-us" });
    expect((result[0] as any)?.content).toBe("Hello {{name}}");
  });

  it("should replace raw channel content", () => {
    const ir = generateIR([
      {
        type: "channel",
        channel: "email",
        raw: {
          html: "<h1>Hello!</h1>",
        },
        locales: {
          "eu-fr": {
            raw: {
              html: "<h1>hola!</h1>",
            },
          },
        },
      },
    ]);

    const result = interpolateLocales({ ir, locale: "eu-fr" });
    expect((result[0] as any).raw?.html).toBe("<h1>hola!</h1>");
  });
});
