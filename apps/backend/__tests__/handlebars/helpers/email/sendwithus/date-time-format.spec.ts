import fmt from "date-fns/format";
import parseISO from "date-fns/parseISO";
import handlebars from "handlebars";
import helper from "~/handlebars/helpers/universal/sendwithus/date-time-format";

const getTimezoneOffset = Date.prototype.getTimezoneOffset;

beforeEach(() => {
  handlebars.registerHelper("swu_datetimeformat", helper);
  Date.prototype.getTimezoneOffset = () => 480;
});

afterEach(() => {
  Date.prototype.getTimezoneOffset = getTimezoneOffset;
});

it("should format the date/time (from sendwithus docs)", () => {
  const iso = parseISO("2015-02-17T18:30:20.000Z");
  const time = iso.getTime();

  expect(
    handlebars.compile(`{{ swu_datetimeformat time "%a, %B %d"}}`)({ time })
  ).toBe("Tue, February 17");
});

it("should throw an exception if the number provided is not an integer", () => {
  const time = new Date().getTime() + 0.12345;
  expect(() =>
    handlebars.compile(`{{swu_datetimeformat time "%a %B %d, %Y %I:%M:%S"}}`)({
      time,
    })
  ).toThrowError(
    "swu_datetimeformat expects milliseconds since epoch as an input"
  );
});

describe("iso-86001 date/time strings", () => {
  it("should support ISO-8601 string input with a positive offset", () => {
    expect(
      handlebars.compile(
        `{{swu_datetimeformat "2021-05-25T08:59:59.000+0900" "%a %B %d, %Y %I:%M:%S"}}`
      )({})
    ).toBe("Tue May 25, 2021 08:59:59");
  });

  it("should support ISO-8601 string input with a negative offset", () => {
    expect(
      handlebars.compile(
        `{{swu_datetimeformat "2021-05-25T08:59:59.000-0300" "%a %B %d, %Y %I:%M:%S"}}`
      )({})
    ).toBe("Tue May 25, 2021 08:59:59");
  });

  it("should support ISO-8601 string input with no offset", () => {
    expect(
      handlebars.compile(
        `{{swu_datetimeformat "2021-05-25T08:59:59.000Z" "%a %B %d, %Y %I:%M:%S"}}`
      )({})
    ).toBe("Tue May 25, 2021 08:59:59");
  });

  it("should throw an exception if the string is not iso-8601", () => {
    expect(() =>
      handlebars.compile(
        `{{swu_datetimeformat "not a date" "%a %B %d, %Y %I:%M:%S"}}`
      )({})
    ).toThrowError(
      "swu_datetimeformat expects string values to be ISO-8601 formatted"
    );
  });
});

[
  { format: "%A", expected: "eeee" },
  { format: "%B", expected: "MMMM" },
  { format: "%H", expected: "HH" },
  { format: "%I", expected: "hh" },
  { format: "%M", expected: "mm" },
  { format: "%S", expected: "ss" },
  { format: "%Y", expected: "yyyy" },
  { format: "%a", expected: "eee" },
  { format: "%b", expected: "MMM" },
  { format: "%d", expected: "dd" },
  { format: "%m", expected: "MM" },
  { format: "%y", expected: "yy" },
].forEach(({ format, expected }) => {
  it(`should support ${format}`, () => {
    const dateTime = Date.now();

    const template = handlebars.compile(
      `{{ swu_datetimeformat dateTime format}}`
    );
    expect(
      template({
        dateTime,
        format,
      })
    ).toBe(fmt(dateTime, expected));
  });
});
