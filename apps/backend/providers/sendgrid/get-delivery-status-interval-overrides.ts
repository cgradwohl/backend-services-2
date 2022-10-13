// The first 18 retries will occur at least ten minutes apart.
export default {
  intervalMap: new Map([...Array(18).keys()].map((i) => [i, 10])),
};
