import assertEmailDomainAllowed from "~/lib/assertions/email-domain-allowed";
import { DeliveryHandlerParams, SendFn } from "./types";

interface ITemplates {
  [key: string]: any;
}

const applyDomainVerification = (sendFn: SendFn<ITemplates>) => {
  const send = (params: DeliveryHandlerParams, templates: ITemplates) => {
    const email = params.profile?.email as string;
    assertEmailDomainAllowed(email);
    assertEmailDomainAllowed(templates.cc);
    assertEmailDomainAllowed(templates.bcc);

    return sendFn(params, templates);
  };

  return send;
};

export default applyDomainVerification;
