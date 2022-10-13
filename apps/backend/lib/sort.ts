export default {
  ascending: function<T>(fn: (t: T) => any) {
    return (a: T, b: T) => {
      return fn(a) > fn(b) ? 1 : -1;
    };
  },
  descending: function<T>(fn: (t: T) => any) {
    return (a: T, b: T) => {
      return fn(a) > fn(b) ? -1 : 1;
    };
  },
};
