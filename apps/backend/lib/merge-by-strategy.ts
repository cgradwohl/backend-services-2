import extend from "deep-extend";
import { MergeStrategy } from "~/types.public";

export const mergeByStrategy = (strategy: MergeStrategy, target, source) => {
  switch (strategy) {
    case "none": {
      // do not make an changes to target if target already exists; else target = source
      if (!target) {
        return source;
      }

      return target;
    }

    case "overwrite": {
      // overwrite all properties in target from source
      return extend(target, source);
    }

    case "replace": {
      // overwrite all properties in target from source;
      // remove properties in target that do not exist in source
      return source;
    }

    case "soft-merge": {
      // only overwrite properties in target from source that do not yet exist in target
      return {
        ...source,
        ...target,
      };
    }
  }
};
