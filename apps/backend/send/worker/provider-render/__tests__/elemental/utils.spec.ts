import {
  isElementalContent,
  transformContentToElementalContent,
  getTitle,
  getElementalContent,
} from "../../elemental/utils";

describe("elemental utils", () => {
  describe("isElementalContent", () => {
    it("should return true for elemental content", () => {
      expect(isElementalContent({ version: "2022-01-01", elements: [] })).toBe(
        true
      );
    });
  });

  describe("transformContentToElementalContent", () => {
    it("should transform content sugar to ElementalContent", () => {
      expect(
        transformContentToElementalContent({
          title: "test title",
          body: "test body",
        })
      ).toMatchObject({
        version: "2022-01-01",
        elements: [
          {
            type: "meta",
            title: "test title",
          },
          {
            type: "text",
            content: "test body",
          },
        ],
      });
    });
  });

  describe("getTitle", () => {
    it("should return the first title", () => {
      expect(getTitle([{ type: "meta", title: "test title" }])).toEqual(
        "test title"
      );
    });
  });

  describe("getElementalContent", () => {
    it("should get elemental content from content sugar", () => {
      expect(
        getElementalContent({ body: "test body", title: "test title" })
      ).toEqual({
        version: "2022-01-01",
        elements: [
          { type: "text", content: "test body" },
          { type: "meta", title: "test title" },
        ],
      });
    });

    it("should get elemental content from normal elemental content", () => {
      expect(
        getElementalContent({
          version: "2022-01-01",
          elements: [
            { type: "meta", title: "test title" },
            { type: "text", content: "test body" },
          ],
        })
      ).toEqual({
        version: "2022-01-01",
        elements: [
          { type: "meta", title: "test title" },
          { type: "text", content: "test body" },
        ],
      });
    });

    it("should include elemental sugar with elemental elements", () => {
      expect(
        getElementalContent({
          version: "2022-01-01",
          title: "foo",
          body: "bar",
          elements: [
            { type: "meta", title: "test title" },
            { type: "text", content: "test body" },
          ],
        })
      ).toEqual({
        version: "2022-01-01",
        elements: [
          { type: "meta", title: "foo" },
          { type: "text", content: "bar" },
          { type: "meta", title: "test title" },
          { type: "text", content: "test body" },
        ],
      });
    });
  });
});
