import { IConfigurationJson } from "~/types.api";

export interface ISendGridConfig extends IConfigurationJson {
  apiKey: string;
  fromAddress: string;
}

interface IEmail {
  email: string;
  name?: string;
}

export interface ISendgridBody {
  to: IEmail[];
  from: IEmail;
  subject: string;
  html: string;
  text: string;
  reply_to?: IEmail;
  cc?: IEmail[];
  bcc?: IEmail[];
  custom_args: { [key: string]: string };
}
