import { paramCase } from "param-case";
import { notificationValidator } from "~/studio/notifications/validate";
import * as fixtures from "./__fixtures__/notifications";

describe("valid", () => {
  Object.keys(fixtures)
    .filter((fixture) => fixture.indexOf("invalid") === -1)
    .forEach((fixture) => {
      it(`should be valid (${paramCase(fixture)}})`, () => {
        const valid = notificationValidator.validate(fixtures[fixture]);
        expect(valid);
        expect(notificationValidator.validate.errors).toBeNull();
      });
    });
});

describe("invalid", () => {
  Object.keys(fixtures)
    .filter((fixture) => fixture.indexOf("invalid") === 0)
    .forEach((fixture) => {
      it(`should be invalid (${paramCase(fixture)})`, () => {
        const valid = notificationValidator.validate(fixtures[fixture]);
        expect(valid).toBeFalsy();
        expect(notificationValidator.validate.errors.length).toBeGreaterThan(0);
      });
    });
});
