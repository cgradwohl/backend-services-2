// TODO replace me with |> whenever its added to the Ecma spec
export const pipe = <T>(val: T) => {
  return {
    into: <U>(fn: (val: T) => U) => pipe(fn(val)),
    complete: () => val,
  };
};
