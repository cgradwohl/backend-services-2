export const getHashFromRange = (range: number) => {
  const min = 1;
  const max = Math.floor(range);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};
