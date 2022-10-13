import applyDefault from "../apply-default";
import { IBrand } from "../types";

describe("apply default brand", () => {
  const brand: IBrand = {
    creator: "mockCreator",
    id: "mockBrand",
    created: 123,
    updated: 456,
    version: "mockVersion",
    name: "Mock Brand",
    updater: "mockUpdater",
    settings: {},
  };

  const defaultBrand: IBrand = {
    creator: "mockCreator",
    id: "mockBrand",
    created: 123,
    updated: 456,
    version: "mockVersion",
    name: "Mock Default Brand",
    updater: "mockUpdater",
    snippets: {
      items: [
        {
          name: "Mock Snippet",
          format: "handlebars",
          value: "mockSnippet",
        },
      ],
    },
    settings: {
      colors: {
        primary: "red",
        secondary: "white",
        tertiary: "blue",
      },
      email: {
        header: {
          barColor: "purple",
        },
        footer: {
          social: {
            facebook: {
              url: "facebook.com",
            },
          },
        },
      },
    },
  };

  it("will not extend default brand with default brands socials without flag", () => {
    const appliedBrand = applyDefault(brand, defaultBrand);

    expect(appliedBrand).toEqual({
      ...brand,
      snippets: defaultBrand.snippets,
      settings: {
        ...defaultBrand.settings,
        email: {
          header: undefined,
          footer: {
            social: undefined,
          },
        },
      },
    });
  });

  it("will extend default brand with default brands socials with flag", () => {
    brand.settings = {
      email: {
        footer: {
          social: {
            inheritDefault: true,
          },
        },
      },
    };
    const appliedBrand = applyDefault(brand, defaultBrand);

    expect(appliedBrand).toEqual({
      ...brand,
      snippets: defaultBrand.snippets,
      settings: {
        ...defaultBrand.settings,
        email: {
          footer: {
            social: {
              ...defaultBrand.settings.email.footer.social,
              inheritDefault: true,
            },
          },
        },
      },
    });
  });
});
