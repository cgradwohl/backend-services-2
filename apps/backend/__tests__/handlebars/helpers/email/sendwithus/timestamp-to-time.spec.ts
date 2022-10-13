import fromUnixTime from "date-fns/fromUnixTime";
import getUnixTime from "date-fns/getUnixTime";
import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/sendwithus/timestamp-to-time";

beforeEach(() => {
  handlebars.registerHelper("swu_timestamp_to_time", helper);
});

it("should return unix epoch timestamp as time", () => {
  const now = new Date();
  const unixTime = getUnixTime(now);
  const milliseconds = fromUnixTime(unixTime).getTime();

  expect(
    handlebars.compile(`{{ swu_timestamp_to_time unixTime}}`)({ unixTime })
  ).toBe(milliseconds.toString());
});

it("should throw an exception if the input is not a unix epoch timestamp format", () => {
  const badEntries = ["", null, undefined];

  for (const badEntry of badEntries) {
    expect(() => {
      handlebars.compile(`{{ swu_timestamp_to_time badEntry}}`)({ badEntry });
    }).toThrow();
  }
});
