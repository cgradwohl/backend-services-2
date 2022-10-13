import { MessageBrandV1Schema } from "./brand-v1.schema";
import { MessageBrandV2Schema } from "./brand-v2.schema";

export const MessageBrandSchema = {
  oneOf: [MessageBrandV1Schema, MessageBrandV2Schema],
};
