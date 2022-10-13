import { addUtmToElementalHref } from "../augment-href";
import { generateIR } from "../elemental/evaluation/generate-ir";

describe("augment-href", () => {
  describe("augmentElementalHref", () => {
    it("should augment action element - href - complete utm", () => {
      const href = "https://www.zuko.com";
      const ir = generateIR([{ type: "action", content: "testing", href }]);
      const utm = {
        campaign: "campana",
        content: "contenido",
        medium: "medio",
        source: "origen",
        term: "termino",
      };
      const result = addUtmToElementalHref(ir[0], utm);

      expect((result as any).href).toBe(
        `${href}/?utm_campaign=${utm.campaign}&utm_content=${utm.content}&utm_medium=${utm.medium}&utm_source=${utm.source}&utm_term=${utm.term}`
      );
    });

    it("should augment action element - href", () => {
      const href = "https://www.zuko.com/test";
      const ir = generateIR([{ type: "action", content: "testing", href }]);
      const utm = {
        content: "contenido",
        medium: "medio",
        term: "termino",
      };
      const result = addUtmToElementalHref(ir[0], utm);

      expect((result as any).type).toBe("action");
      expect((result as any).href).toBe(
        `${href}?utm_content=${utm.content}&utm_medium=${utm.medium}&utm_term=${utm.term}`
      );
    });

    it("should augment image element - href", () => {
      const href = "https://www.zuko.com/test";
      const ir = generateIR([{ type: "image", src: "testing", href }]);
      const utm = {
        content: "contenido",
        medium: "medio",
        term: "termino",
      };
      const result = addUtmToElementalHref(ir[0], utm);

      expect((result as any).type).toBe("image");
      expect((result as any).href).toBe(
        `${href}?utm_content=${utm.content}&utm_medium=${utm.medium}&utm_term=${utm.term}`
      );
    });

    it("should work with existing query strings", () => {
      const href = "https://www.zuko.com/test?v=5";
      const ir = generateIR([{ type: "image", src: "testing", href }]);
      const utm = {
        content: "contenido",
        medium: "medio",
        term: "termino",
      };
      const result = addUtmToElementalHref(ir[0], utm);

      expect((result as any).type).toBe("image");
      expect((result as any).href).toBe(
        `${href}&utm_content=${utm.content}&utm_medium=${utm.medium}&utm_term=${utm.term}`
      );
    });

    it("not modify invalid URLs", () => {
      const href = "/test";
      const ir = generateIR([{ type: "image", src: "testing", href }]);
      const utm = {
        content: "contenido",
        medium: "medio",
        term: "termino",
      };
      const result = addUtmToElementalHref(ir[0], utm);

      expect((result as any).type).toBe("image");
      expect((result as any).href).toBe(href);
    });
  });
});
