import Ajv, { _ } from "ajv";
import ajvErrors from "ajv-errors";
import ajvFormats from "ajv-formats";

import standaloneCode from "ajv/dist/standalone";

import * as fs from "fs";
import * as path from "path";
import { RequestV2Schema } from "~/api/send/validation/request.schema";

(function (): void {
  const ajv = new Ajv({
    allErrors: true,
    code: {
      source: true,
      formats: _`require("./custom-formats")`,
    },
  });
  ajvErrors(ajv);
  ajvFormats(ajv);
  ajv.addFormat("noEmptyString", {
    type: "string",
    validate: (x) => (x !== "" ? true : false),
  });

  const validateRequestV2ForModuleCode = ajv.compile(RequestV2Schema);

  let moduleCode = standaloneCode(ajv, validateRequestV2ForModuleCode);

  fs.writeFileSync(
    path.join(__dirname, "./request-v2/validate-request-v2.js"),
    moduleCode
  );
})();
