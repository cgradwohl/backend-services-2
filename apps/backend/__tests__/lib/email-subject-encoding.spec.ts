import { encode, decode } from "~/lib/email-subject-encoding";

it("should not encode email subject with only ascii", () => {
  const subject = "I'm a email subject";
  const encoded = encode(subject);

  expect(encoded).toEqual(subject);
});

it("should encode email subject with unicode", () => {
  const subject = "I'm a èmail subject";
  const encoded = encode(subject);

  expect(encoded).toEqual("=?UTF-8?B?SSdtIGEgw6htYWlsIHN1YmplY3Q=?=");
});

it("should trim a really long subject", () => {
  const subject =
    "I'm a èmail subjectI'm a èmail subjectI'm a èmail subjectI'm a èmail subject";
  const encoded = encode(subject, 78);
  const decoded = decode(encoded);

  expect(decoded).toEqual("I'm a èmail subjectI'm a èmail subjectI'm a è");
});
