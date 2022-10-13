import { IBrand } from "~/lib/brands/types";
import mdToSlate from "~/lib/slate/md-to-slate";
import slateToMd from "~/lib/slate/slate-to-md";

type TransformFn = (
  footer: IBrand["settings"]["email"]["footer"]
) => IBrand["settings"]["email"]["footer"];

export const transformRequest: TransformFn = footer => {
  if (!footer) {
    return {};
  }

  return {
    content: footer.markdown ? mdToSlate(footer.markdown) : null,
    social: footer.social,
  };
};

export const transformResponse: TransformFn = footer => {
  if (!footer) {
    return {};
  }

  return {
    markdown: footer.content ? slateToMd(footer.content) : null,
    social: footer.social,
  };
};
