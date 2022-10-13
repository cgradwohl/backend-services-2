import {
  weeksToSeconds,
  daysToSeconds,
  hoursToSeconds,
} from "../../lib/toSeconds";

describe("toSeconds", () => {
  const tests = [2, 3, 5, 7, 11];
  it("should convert weeks to seconds", () => {
    tests.forEach(test => {
      expect(weeksToSeconds(test)).toEqual(test * 7 * 24 * 60 * 60);
    });
  });

  it("should convert days to seconds", () => {
    tests.forEach(test => {
      expect(daysToSeconds(test)).toEqual(test * 24 * 60 * 60);
    });
  });

  it("should convert hours to seconds", () => {
    tests.forEach(test => {
      expect(hoursToSeconds(test)).toEqual(test * 60 * 60);
    });
  });
});
