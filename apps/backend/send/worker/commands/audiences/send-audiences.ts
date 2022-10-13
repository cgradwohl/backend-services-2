import { audiencesService } from "~/send/service/audiences";
import { ISendAudiencesAction } from "~/send/types";

export const sendAudiences = async (action: ISendAudiencesAction) =>
  audiencesService(action.tenantId).emit<ISendAudiencesAction>(action);
