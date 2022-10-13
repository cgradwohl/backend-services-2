import { BaseError } from "make-error";
import { getEmail } from "../email-parser";

export class EmailDomainBlockedError extends BaseError {
  private _emailAddress: string;

  get emailAddress() {
    return this._emailAddress;
  }

  constructor(emailAddress: string) {
    super("Recipient email contains a reserved domain");
    this._emailAddress = emailAddress;
  }
}

// https://datatracker.ietf.org/doc/html/rfc2606#section-3
const BLOCKED_DOMAINS = [/@example.com$/, /@example.net$/, /@example.org$/];

const assertEmailDomainAllowed = (emailAddress: string) => {
  if (typeof emailAddress !== 'string') {
    return;
  }
  
  const email = emailAddress?.trim();
  
  if (!email) {
    return;
  }

  const emailStrings = email.split(",");
  for (const emailString of emailStrings) {
    for (const domain of BLOCKED_DOMAINS) {
      if (getEmail(emailString)?.email?.match(domain)) {
        throw new EmailDomainBlockedError(emailString);
      }
    }
  }
};

export default assertEmailDomainAllowed;
