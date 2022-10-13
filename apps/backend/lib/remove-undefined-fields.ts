// Recursively removes undefined fields of passed object (by mutation). Returns object for convenience.
export function removeUndefinedFields<T extends object>(data: T): T {
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) {
      delete data[key];
    }

    if (typeof data[key] === "object") {
      removeUndefinedFields(data[key]);
    }
  });

  return data;
}
