import { BrandCourierObject, IBrand } from "./types";

type FromCourierObjectFn = (courierObject: BrandCourierObject) => IBrand;

export const fromCourierObject: FromCourierObjectFn = (courierObject) => {
  if (!courierObject) {
    return null;
  }

  const { created, creator, published, title, updated, updater, version } =
    courierObject;
  const match = courierObject.id.match(/^brand\/(.*)/);
  const id = match ? match[1] : courierObject.id;

  const { json } = courierObject;

  return {
    created,
    creator,
    id,
    name: title,
    published,
    settings: json.settings,
    snippets: json.snippets,
    updated: updated || created,
    updater: updater || creator,
    version,
  };
};

export default fromCourierObject;
