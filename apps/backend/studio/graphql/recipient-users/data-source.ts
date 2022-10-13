import { getTokensByRecipient } from "~/lib/token-storage";
import DataSource from "../lib/data-source";

export default class RecipientUsersDataSource extends DataSource {
  get objtype(): string {
    return "end-user";
  }

  public async getRecipientUserTokens(userId: string) {
    const { tenantId } = this.context;
    const tokens = await getTokensByRecipient({
      tenantId,
      recipientId: userId,
    });
    return tokens.map((token) => ({
      token: token.token,
      status: token.status,
      providerKey: token.providerKey,
      device: {
        deviceId: token.device?.deviceId,
      },
    }));
  }

  protected map = () => null;
}
