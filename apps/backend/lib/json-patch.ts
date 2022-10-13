import {
  applyOperation,
  applyPatch,
  getValueByPointer,
  Operation,
} from "fast-json-patch";

// attempting to add to an undefined object throws an error; create them first
export const ensureObjects = (doc: any, patchOps: Operation[]): any => {
  const paths = [];
  for (const op of patchOps) {
    const segments = op.path.split("/");
    const path = [];
    for (const segment of segments) {
      if (segment === "") {
        continue;
      } else if (segment === "-" || !isNaN(Number(segment))) {
        break;
      } else {
        path.push(segment);
      }
    }
    if (path.length) {
      paths.push(path);
    }
  }

  // ASC  -> a.length - b.length
  // DESC -> b.length - a.length
  const sortedPaths = paths.sort((a, b) => a.length - b.length);

  for (const segments of sortedPaths) {
    for (let i = 0; i < segments.length; i++) {
      const path = `/${segments.slice(0, i + 1).join("/")}`;
      const obj = getValueByPointer(doc, path);
      if (!obj) {
        applyOperation(doc, {
          op: "add",
          path,
          value: {},
        });
      }
    }
  }

  return doc;
};

// attempting to add to an undefined array throws an error; create them first
export const ensureArrays = (doc: any, patchOps: Operation[]): any => {
  const ARRAY_PATH = /^(.*)\/-$/;
  for (const op of patchOps) {
    if (ARRAY_PATH.test(op.path)) {
      const [, path] = op.path.match(ARRAY_PATH);
      const arr = getValueByPointer(doc, path);
      if (!arr) {
        applyOperation(doc, {
          op: "add",
          path,
          value: [],
        });
      }
    }
  }
  return doc;
};

export const getPatchedDocument = <T = any>(data, patch) => {
  if (!patch || !Array.isArray(patch) || !patch.length) {
    return;
  }

  const docWithObjects = ensureObjects(data, patch);

  const docWithArrays = ensureArrays(docWithObjects, patch);
  const patchedProfile = applyPatch(docWithArrays, patch);
  return patchedProfile.newDocument as T;
};
