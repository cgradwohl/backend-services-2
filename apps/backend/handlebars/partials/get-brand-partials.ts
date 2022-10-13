import { IBrand } from "~/lib/brands/types";
import compilePartialsObject from "./compile-partials-object";

type GetBrandPartialsFn = (
  brand: IBrand
) => ReturnType<typeof compilePartialsObject>;

const getBrandPartials: GetBrandPartialsFn = (brand) => {
  if (!brand?.snippets?.items) {
    return {};
  }

  const partials = brand.snippets.items.reduce((acc, snippet) => {
    if (snippet.format !== "handlebars") {
      return acc;
    }

    return {
      ...acc,
      [snippet.name]: snippet.value,
    };
  }, {});

  return compilePartialsObject(partials);
};

export default getBrandPartials;
