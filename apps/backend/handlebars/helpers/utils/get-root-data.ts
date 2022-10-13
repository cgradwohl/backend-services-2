import { HelperOptions } from "handlebars";

const recursivelyGetParent = (data: any) => {
  if (
    !("_parent" in data) ||
    !data._parent ||
    typeof data._parent !== "object"
  ) {
    return data;
  }

  return recursivelyGetParent(data._parent);
};

const getRootHandlebarsData = (data: any) => {
  if (!data || typeof data !== "object") {
    return data;
  }

  return recursivelyGetParent(data);
};

export default getRootHandlebarsData;
