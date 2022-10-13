import assertEmailDomainAllowed, {
  EmailDomainBlockedError,
} from "~/lib/assertions/email-domain-allowed";

// should pass
[
  "email@courier.com",
  "email@gmail.com",
  "email@hotmail.com",
  "email@msn.com",
  "email@aol.com",
  "Example <email@courier.com>",
  // start list of randomly generated emails
  "jchristopherson0@youtu.be",
  "dcaffin1@storify.com",
  "cchittie2@squidoo.com",
  "onesbeth3@geocities.com",
  "jdominey4@census.gov",
  "kramiro5@gnu.org",
  "abiggins6@devhub.com",
  // end list of randomly generated emails
].forEach((emailAddress) => {
  it(`email address (${emailAddress}) should pass assertion`, () => {
    expect(() => {
      assertEmailDomainAllowed(emailAddress);
    }).not.toThrow();
  });
});

// should not pass
[
  "email@example.com",
  "email@example.net",
  "email@example.org",
  "Example <email@example.com>",
  "Example <email@example.net>",
  "Example <email@example.org>",
].forEach((emailAddress) => {
  it(`email address (${emailAddress}) should not pass assertion`, () => {
    expect(() => {
      assertEmailDomainAllowed(emailAddress);
    }).toThrowError(EmailDomainBlockedError);
  });
});
