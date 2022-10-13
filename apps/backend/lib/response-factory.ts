import { ResponseTemplate } from "lambda-response-template";
import REQUIRED_SECURITY_HEADERS from "./required-security-headers";

export default new ResponseTemplate({
  headers: {
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
    ...REQUIRED_SECURITY_HEADERS,
  },
  transform: (value) => JSON.stringify(value),
});
