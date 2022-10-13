import validator from "email-validator";

export class EmailParseError extends Error {
  public data?: any;

  // via: https://blog.joefallon.net/2018/09/typescript-try-catch-finally-and-custom-errors/
  constructor(message: string, data?: any) {
    super(message);

    // see: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = EmailParseError.name;
    Error.captureStackTrace(this, EmailParseError);

    // optional error payload
    if (data) {
      this.data = data;
    }
  }
}

const onlyVariable = /^\{[^}]*\}$/;

export interface IParsedEmail {
  email: string;
  name?: string;
}

type EmailParts = IParsedEmail | IParsedEmail[];

function checkEmailPartsIsArray(
  emailParts: EmailParts
): emailParts is IParsedEmail[] {
  return (
    Array.isArray(emailParts) &&
    emailParts.every((emailPart) => checkEmailParts(emailPart))
  );
}

function checkEmailParts(emailParts: EmailParts): emailParts is IParsedEmail {
  return !Array.isArray(emailParts) && Boolean(emailParts?.email);
}

export const formatEmail = (
  emailParts: EmailParts,
  withArrows = true
): string => {
  if (checkEmailPartsIsArray(emailParts)) {
    const formattedEmails = emailParts
      .map((parts) => formatEmail(parts, withArrows))
      .filter(Boolean)
      .join(",");

    return formattedEmails || undefined;
  }

  if (!checkEmailParts(emailParts)) {
    return;
  }

  if (emailParts.name) {
    return withArrows
      ? `"${emailParts.name}" <${emailParts.email}>`
      : `"${emailParts.name}" ${emailParts.email}`;
  }

  return emailParts.email;
};

export const getEmail = (emailString: string, label?: string) => {
  const emailStringParts = emailString.trim().split(" ");

  let email = emailStringParts.pop();
  // Matches a group within chompers.
  // e.g. <Courier> -> [, Courier]
  const matchArrows = email.match(/^<(.*?)>$/);

  if (matchArrows) {
    email = matchArrows[1];
  }

  // Replaces " with empty string.
  // e.g. "support@courier.app" -> support@courier.app
  let name = emailStringParts.join(" ").replace(/["]+/g, "");
  // Matches a group within single quotes.
  // e.g. 'support@courier.app' -> [, support@courier.app]
  const matchSingleQuotes = name.match(/^'(.*?)'$/);

  if (matchSingleQuotes) {
    name = matchSingleQuotes[1];
  }

  if (!email) {
    return undefined;
  }

  if (!validator.validate(email)) {
    // email was an address that wasn't resolved?
    if (onlyVariable.test(email)) {
      return undefined;
    }

    // bad email
    throw new EmailParseError("Invalid Email", {
      email: emailString,
      label: label || undefined,
      name: name || undefined,
    });
  }

  return { email, name };
};

export function assertEmailIsValid(email: string, label?: string): void {
  if (!email || typeof email !== "string") {
    throw new EmailParseError("Invalid Email", { email, label });
  }

  email = email.trim();
  const emailStrings = email.split(",");

  for (const emailString of emailStrings) {
    getEmail(emailString, label);
  }
}

export default function emailParser(
  emailInput?: string,
  label?: string
): IParsedEmail[] {
  if (!emailInput || typeof emailInput !== "string") {
    return [];
  }

  emailInput = emailInput.trim();
  const emailStrings = emailInput.split(",");

  return emailStrings
    .map((emailString) => {
      const emailValue = getEmail(emailString, label);

      if (!emailValue) {
        return undefined;
      }

      const { email, name } = emailValue;

      return {
        // do not return empty string
        email,
        name: name || undefined,
      };
    })
    .filter((email) => Boolean(email));
}
