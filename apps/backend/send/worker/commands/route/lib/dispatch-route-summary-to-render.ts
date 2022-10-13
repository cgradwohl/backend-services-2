import { renderService } from "~/send/service";
import { IRenderProviderPayload } from "~/send/types";
import { IRoutingSummary } from "../types";

export async function dispatchRouteSummaryToRenderService({
  contextFilePath,
  dryRunKey,
  messageFilePath,
  messageId,
  requestId,
  routingSummary,
  tenantId,
  shouldVerifyRequestTranslation = false,
  translated = false,
}: {
  contextFilePath: string;
  dryRunKey: string;
  messageFilePath: string;
  messageId: string;
  requestId: string;
  routingSummary: Partial<IRoutingSummary>[];
  tenantId: string;
  shouldVerifyRequestTranslation?: boolean;
  translated?: boolean;
}) {
  const dispatches = routingSummary
    .filter((summary) => summary.selected)
    .map(
      (summary): IRenderProviderPayload => ({
        command: "render",
        channel: summary.channel,
        channelId: summary.id!,
        contextFilePath: contextFilePath,
        dryRunKey,
        messageId,
        messageFilePath,
        configurationId: summary.configurationId!,
        requestId,
        tenantId,
        shouldVerifyRequestTranslation,
        translated,
      })
    )
    .map((payload) => renderService(tenantId).emit(payload));

  await Promise.all(dispatches);
}
