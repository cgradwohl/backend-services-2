import {
  sizeInBytes,
  sizeInKiB,
  sizeInWriteCapacityUnits,
} from "~/lib/object-size";

const KiB = 1024;
const baseObjectSize = Buffer.byteLength(JSON.stringify({ a: "" }));

describe("sizeInBytes", () => {
  it("should calculate object size in bytes", () => {
    const input = { a: "b".repeat(KiB - baseObjectSize) };
    expect(sizeInBytes(input)).toBe(1024);
  });

  it("should handle null", () => {
    expect(sizeInBytes(null)).toBe(4);
  });

  it("should handle undefined", () => {
    expect(sizeInBytes(undefined)).toBe(0);
  });
});

describe("sizeInKiB", () => {
  it("should calculate object size in KiB", () => {
    const input = { a: "b".repeat(KiB - baseObjectSize) };
    expect(sizeInKiB(input)).toBe(1);
  });
});

describe("sizeInWriteCapacityUnits", () => {
  it("should return 1 for items that are less than 1024 KiB", () => {
    const input = { a: "b".repeat(KiB - 1 - baseObjectSize) };
    expect(sizeInWriteCapacityUnits(input)).toBe(1);
  });

  it("should return 1 for items that are exactly 1024 KiB", () => {
    const input = { a: "b".repeat(KiB - baseObjectSize) };
    expect(sizeInWriteCapacityUnits(input)).toBe(1);
  });

  it("should return 2 for items that are greater 1024 KiB", () => {
    const input = { a: "b".repeat(KiB + 1 - baseObjectSize) };
    expect(sizeInWriteCapacityUnits(input)).toBe(2);
  });

  it("should return 3 for items that are greater 2048 KiB", () => {
    const input = { a: "b".repeat(KiB * 2 + 1 - baseObjectSize) };
    expect(sizeInWriteCapacityUnits(input)).toBe(3);
  });
});
