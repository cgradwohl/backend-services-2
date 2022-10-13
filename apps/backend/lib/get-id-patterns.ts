const getIdPatterns = (listId: string): string[] => {
  const recurse = (current: string, parents: string[] = [], tail: string[]) => {
    const newParents = [];
    const results = [];
    for (const parent of parents) {
      newParents.push(`${parent}.*`);
      newParents.push(`${parent}.${current}`);
      if (!parent.includes("*")) {
        results.push(`${parent}.**`);
      }
    }

    if (!tail.length) {
      // filter exact matches and ones where all segments have "*"
      return results.concat(
        newParents
          .filter((p) => !p.match(/^(\*\.){0,5}\*$/))
          .filter((p) => !p.split(".")?.every((t: string) => t !== "*"))
      );
    }

    return results.concat(recurse(tail[0], newParents, tail.slice(1)));
  };

  const [head, ...rest] = listId.split(".");

  // Support for IDs with one segment
  if (!rest?.length) {
    return [];
  }

  // Support for IDs with two segments
  if (rest.length === 1) {
    return [`${head}.*`, `*.${rest[0]}`, `${head}.**`].sort();
  }

  // Support for IDs with > two segments
  return recurse(rest[0], [head, "*"], rest.slice(1)).sort();
};

export default getIdPatterns;
