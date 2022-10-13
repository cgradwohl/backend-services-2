export default <T = any>(array: T[], chunkSize = 25) =>
  Array.from({ length: Math.ceil(array.length / chunkSize) }, (v, i) =>
    array.slice(i * chunkSize, i * chunkSize + chunkSize)
  );
