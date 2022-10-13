import handles from "~/providers/lib/email/handles";

it("should return true when provided an email", () => {
  expect(
    handles({
      config: {} as any,
      profile: { email: "test@courier.com" },
    })
  ).toEqual(true);
});

it("should require email", () => {
  expect(
    handles({
      config: {} as any,
      profile: {},
    })
  ).toEqual(false);
});

it("should require a valid email", () => {
  expect(
    handles({
      config: {} as any,
      profile: {
        email: "thisisnotanemail",
      },
    })
  ).toEqual(false);
});
