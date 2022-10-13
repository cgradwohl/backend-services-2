import axios from "axios";
import * as CompanyEmailValidator from "company-email-validator";

export interface IKickboxEmailVerificationResponse {
  domain: string;
  isCompanyEmail: boolean;
  kickbox_is_disposable: string;
  kickbox_is_free: boolean;
  kickbox_reason: string;
  kickbox_result: string;
}

export async function verifyEmail(
  email: string
): Promise<IKickboxEmailVerificationResponse> {
  const KICKBOX_API_KEY = process.env.KICKBOX_API_KEY;
  if (!KICKBOX_API_KEY) {
    // tslint:disable-next-line: no-console
    console.warn(
      `KICKBOX_API_KEY not detected, Email: ${email} could not be verified`
    );
    return;
  }

  try {
    const { data } = await axios.request({
      headers: { "Content-Type": "application/json" },
      method: "GET",
      params: {
        apikey: KICKBOX_API_KEY,
        email,
        timeout: "1000",
      },
      url: "https://api.kickbox.com/v2/verify",
    });
    const isCompanyEmail = CompanyEmailValidator.isCompanyEmail(email);
    const isEdu = email.includes(".edu");
    const isGov = email.includes(".gov");

    const { disposable, free, reason, result, domain } = data;

    return {
      domain,
      isCompanyEmail:
        isCompanyEmail &&
        !disposable &&
        !free &&
        result !== "undeliverable" &&
        !isEdu &&
        !isGov,
      kickbox_is_disposable: disposable,
      kickbox_is_free: free,
      kickbox_reason: reason,
      kickbox_result: result,
    };
  } catch (e) {
    // tslint:disable-next-line: no-console
    console.error("Unable to verify email via Kickbox", e);
    return;
  }
}
