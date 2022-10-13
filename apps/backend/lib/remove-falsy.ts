function removeFalsy(object = {}) {
  if (Array.isArray(object)) {
    return object.map(removeFalsy).filter(Boolean);
  }

  const newObject = Object.keys(object).reduce((acc, property) => {
    if (typeof object[property] === "object") {
      const sanitizedObject = removeFalsy(object[property]);

      if (sanitizedObject) {
        acc[property] = sanitizedObject;
      }

      return acc;
    }

    if (object[property]) {
      acc[property] = object[property];
    }

    return acc;
  }, {});

  if (Object.keys(newObject).length === 0) {
    return;
  }

  return newObject;
}

export default removeFalsy;
