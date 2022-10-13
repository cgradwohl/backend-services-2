import { createSchemaValidator } from "~/lib/create-schema-validator";
import { IEmailOpenTrackingSettings } from "~/types.api";

export const emailOpenSettingsSchema = {
  additionalProperties: false,
  properties: {
    enabled: { type: "boolean" },
  },
  required: ["enabled"],
  type: "object",
};

const validateEmailOpenTrackingSettings = createSchemaValidator<
  IEmailOpenTrackingSettings
>(emailOpenSettingsSchema);

export default validateEmailOpenTrackingSettings;
