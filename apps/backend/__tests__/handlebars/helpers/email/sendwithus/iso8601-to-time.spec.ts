import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/sendwithus/iso8601-to-time";

beforeEach(() => {
  handlebars.registerHelper("swu_iso8601_to_time", helper);
});

it("should return an ISO-8601 string as time", () => {
  const now = new Date();
  const isoString = now.toISOString();

  expect(
    handlebars.compile(`{{ swu_iso8601_to_time isoString}}`)({ isoString })
  ).toBe(now.getTime().toString());
});

it("should throw an exception if the input is not ISO-8601 format", () => {
  const badEntries = ["A", Date.now(), "", null, undefined];

  for (const badEntry of badEntries) {
    expect(() => {
      handlebars.compile(`{{ swu_iso8601_to_time badEntry}}`)({ badEntry });
    }).toThrow();
  }
});
