import emailParser, { EmailParseError, formatEmail } from "~/lib/email-parser";

it("regular email string", () => {
  const emailString = "mail@courier.com";
  const parsed = emailParser(emailString);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email: emailString,
      name: undefined,
    },
  ]);

  expect(formatted).toBe(emailString);
});

it("no email string", () => {
  const parsed = emailParser();
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([]);

  expect(formatted).toEqual(undefined);
});

it("name <email>", () => {
  const email = "mail@courier.com";
  const name = "name";
  const parsed = emailParser(`${name} <${email}>`);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email,
      name,
    },
  ]);

  expect(formatted).toBe(`"${name}" <${email}>`);
});

it("first last <email>", () => {
  const email = "mail@courier.com";
  const name = "first last";

  const parsed = emailParser(`${name} <${email}>`);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email,
      name,
    },
  ]);

  expect(formatted).toBe(`"${name}" <${email}>`);
});

it("first middle last <email>", () => {
  const email = "mail@courier.com";
  const name = "first middle last";

  const parsed = emailParser(`${name} <${email}>`);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email,
      name,
    },
  ]);

  expect(formatted).toBe(`"${name}" <${email}>`);
});

it("name email", () => {
  const email = "mail@courier.com";
  const name = "name";

  const parsed = emailParser(`${name} ${email}`);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email,
      name,
    },
  ]);

  expect(formatted).toBe(`"${name}" <${email}>`);
});

it("name email, no arrows", () => {
  const email = "mail@courier.com";
  const name = "name";

  const parsed = emailParser(`${name} ${email}`);
  const formatted = formatEmail(parsed, false);

  expect(parsed).toEqual([
    {
      email,
      name,
    },
  ]);

  expect(formatted).toBe(`"${name}" ${email}`);
});

it("multiple email", () => {
  const email1 = "mail@courier.com";
  const name1 = "name";

  const email2 = "mail2@courier.com";
  const name2 = "name2";

  const parsed = emailParser(`${name1} ${email1}, ${name2} ${email2}`);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email: email1,
      name: name1,
    },
    {
      email: email2,
      name: name2,
    },
  ]);

  expect(formatted).toBe(`"${name1}" <${email1}>,"${name2}" <${email2}>`);
});

it("multiple email2", () => {
  const email1 = "mail@courier.com";
  const email2 = "mail2@courier.com";

  const parsed = emailParser(`${email1}, ${email2}`);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email: email1,
    },
    {
      email: email2,
    },
  ]);

  expect(formatted).toBe(`${email1},${email2}`);
});

it("multiple email3", () => {
  const email1 = "mail@courier.com";
  const email2 = "mail2@courier.com";
  const name2 = "name2";

  const parsed = emailParser(`${email1}, ${name2} <${email2}>`);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email: email1,
    },
    {
      email: email2,
      name: name2,
    },
  ]);
  expect(formatted).toBe(`${email1},"${name2}" <${email2}>`);
});

it("will handle quotes", () => {
  const email = "mail@courier.com";
  const name = "name";

  const parsed = emailParser(`"${name}" ${email}`);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email,
      name,
    },
  ]);

  expect(formatted).toBe(`"${name}" <${email}>`);

  const parsed2 = emailParser(`'${name}' ${email}`);
  const formatted2 = formatEmail(parsed2);

  expect(parsed2).toEqual([
    {
      email,
      name,
    },
  ]);

  expect(formatted2).toBe(`"${name}" <${email}>`);
});

it("will maintain single quotes inside text", () => {
  const email = "mail@courier.com";
  const name = "riley's name";

  const parsed = emailParser(`${name} ${email}`);
  const formatted = formatEmail(parsed);

  expect(parsed).toEqual([
    {
      email,
      name,
    },
  ]);

  expect(formatted).toBe(`"${name}" <${email}>`);
});

it("invalid email", () => {
  const email = "mail@@courier.com";
  const name = "name";

  expect(() => emailParser(`${name} ${email}`)).toThrow(/Invalid Email/);
});

it("invalid email2", () => {
  const email = "ma<il@@tryco>urier.com";
  const name = "name";

  expect(() => emailParser(`${name} ${email}`)).toThrow(/Invalid Email/);
});

it("should check for unresolved variable", () => {
  expect(emailParser("{unresolved}")).toEqual([]);
});

it("should check for unresolved variable only in email", () => {
  expect(emailParser("Test <{unresolved}>")).toEqual([]);
});

it("should check for unresolved variable any a list of emails", () => {
  expect(
    emailParser(
      "josh@courier.com, Support <support@courier.com>, Bad <{unresolved}>, {unresolved}"
    )
  ).toEqual([
    { email: "josh@courier.com", name: undefined },
    { email: "support@courier.com", name: "Support" },
  ]);
});

it("should throw a provider response error with a payload containing the bad email", () => {
  try {
    emailParser("bademail");

    // expected to throw
    expect("here").toEqual("not to have been reached");
  } catch (err) {
    expect(err).toBeInstanceOf(EmailParseError);
    expect(err.data).toEqual({ email: "bademail" });
  }
});

it("should throw a provider response and include a provided label", () => {
  try {
    emailParser("bademail", "Label");

    // expected to throw
    expect("here").toEqual("not to have been reached");
  } catch (err) {
    expect(err).toBeInstanceOf(EmailParseError);
    expect(err.data).toEqual({ email: "bademail", label: "Label" });
  }
});
