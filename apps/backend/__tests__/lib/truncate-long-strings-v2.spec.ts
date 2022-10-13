import truncate from "~/lib/truncate-long-strings-v2";

const createString = (length: number, char: string = "a") =>
  char.repeat(length);

const KiB = 1024;
const KiB_10 = KiB * 10;
const KiB_100 = KiB * 100;
const KiB_1000 = KiB * 1000;

it("should truncate a string", () => {
  const input = createString(KiB_100);
  expect(truncate(input)).toBe(`[Truncated] ${input.substring(0, 100)}...`);
});

describe("array processing", () => {
  it("should truncate an array of strings", () => {
    const input = [createString(KiB_100)];
    expect(truncate(input)).toStrictEqual([
      `[Truncated] ${input[0].substring(0, 100)}...`,
    ]);
  });

  it("should truncate an array of objects", () => {
    const obj = {
      long: createString(KiB_100),
      short: createString(KiB_10),
    };
    const input = [obj];

    expect(truncate(input)).toStrictEqual([
      {
        ...obj,
        long: `[Truncated] ${obj.long.substring(0, 100)}...`,
      },
    ]);
  });
});

describe("object processing", () => {
  const long = createString(KiB_100);
  const short = createString(KiB_10);

  it("should truncate an object", () => {
    const input = { long, short };
    expect(truncate(input)).toStrictEqual({
      ...input,
      long: `[Truncated] ${long.substring(0, 100)}...`,
    });
  });

  it("should process nested objects", () => {
    const input = {
      level1: {
        level2: {
          level3: { long, short },
        },
      },
    };

    expect(truncate(input)).toStrictEqual({
      level1: {
        level2: {
          level3: {
            long: `[Truncated] ${long.substring(0, 100)}...`,
            short,
          },
        },
      },
    });
  });

  it("should leave booleans untouched", () => {
    const input = { bool1: true, bool2: false };
    expect(truncate(input)).toStrictEqual(input);
  });

  it("should leave numbers untouched", () => {
    const input = { num1: 5, num2: 5.5 };
    expect(truncate(input)).toStrictEqual(input);
  });

  it("should leave null and undefined untouched", () => {
    const input = { key1: null, key2: undefined };
    expect(truncate(input)).toStrictEqual(input);
  });
});

describe("options", () => {
  it("should allow truncate truncateAtKiB to be overridden", () => {
    const input = "a".repeat(KiB_10);
    expect(truncate(input, { truncateAtKiB: 10 })).toBe(
      `[Truncated] ${input.substring(0, 100)}...`
    );
  });

  it("should allow truncate truncateLength to be overridden", () => {
    const input = "a".repeat(KiB_100);
    expect(truncate(input, { truncateLength: 10 })).toBe(
      `[Truncated] ${input.substring(0, 10)}...`
    );
  });

  it("should enforce maximum size in KiB to truncate at", () => {
    const input = "a".repeat(KiB_1000);
    expect(truncate(input, { truncateAtKiB: 2048 })).toBe(
      `[Truncated] ${input.substring(0, 100)}...`
    );
  });

  it("should enforce maximum return length for the truncated value", () => {
    const input = "a".repeat(KiB_1000);
    expect(truncate(input, { truncateLength: 1000 })).toBe(
      `[Truncated] ${input.substring(0, 200)}...`
    );
  });
});
