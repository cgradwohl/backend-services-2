import { getContext, putContext } from "../stores/s3/context";
import { ContextService, ISendMessageContext } from "../types";

// NOTE: tenantId is not used at all here
const contextService: ContextService = (tenantId) => {
  return {
    create: async ({ messageId, context }) => {
      const { filePath } = await putContext({ messageId, json: context });

      return { filePath };
    },

    get: async ({ filePath }): Promise<ISendMessageContext> => {
      const context = await getContext({ filePath });

      return context as ISendMessageContext;
    },
  };
};

export default contextService;
