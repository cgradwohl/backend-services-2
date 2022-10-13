import { createSchemaValidator } from "~/lib/create-schema-validator";
import { IClickThroughTrackingSettings } from "~/types.api";

export const clickThroughSettingsSchema = {
  additionalProperties: false,
  properties: {
    enabled: { type: "boolean" },
  },
  required: ["enabled"],
  type: "object",
};

const validateClickThroughTrackingSettings = createSchemaValidator<
  IClickThroughTrackingSettings
>(clickThroughSettingsSchema);

export default validateClickThroughTrackingSettings;
