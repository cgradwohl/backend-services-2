const KiB = 1024;

export const sizeInBytes = (input: Record<string, any>): number => {
  if (input === undefined) {
    return 0;
  }

  return Buffer.byteLength(JSON.stringify(input));
};

export const sizeInKiB = (input: Record<string, any>): number =>
  sizeInBytes(input) / KiB;

export const sizeInWriteCapacityUnits = (input: Record<string, any>): number =>
  Math.ceil(sizeInKiB(input));
