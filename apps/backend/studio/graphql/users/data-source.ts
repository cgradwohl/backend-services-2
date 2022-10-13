import { ForbiddenError } from "apollo-server-lambda";
import { createHmac } from "crypto";
import jwt from "jsonwebtoken";
import { getUser, IUser } from "~/lib/cognito";
import { queryByTenantId } from "~/lib/dynamo/tenant-auth-tokens";
import {
  get as getAccessRight,
  setRole,
  updateUserDetails,
} from "~/lib/tenant-access-rights-service";
import createEncodedId from "../lib/create-encoded-id";
import DataSource from "../lib/data-source";

const uservoiceSSOKey = process.env.USERVOICE_SSO_KEY;

export default class UsersDataSource extends DataSource {
  get objtype(): string {
    return "user";
  }

  public async getRole(userId: string) {
    const { tenantId } = this.context;

    // validate requested user resource belongs to the tenant
    const accessRight = await getAccessRight({
      tenantId,
      userId,
    });
    if (!accessRight) {
      throw new ForbiddenError("Forbidden");
    }

    return accessRight.role ?? "MANAGER";
  }

  public async getSignature() {
    const { env, user } = this.context;
    const authTokens = await queryByTenantId(process.env.COURIER_TENANT_ID);
    const scope = env === "test" ? "published/test" : "published/production";
    const token = authTokens.find(({ scope: s }) => s === scope);

    if (!token) {
      return;
    }

    const computedUserHmac = createHmac("sha256", token.authToken)
      .update(user.id)
      .digest("hex");

    return computedUserHmac;
  }

  public async getUservoiceJWT() {
    const { user } = this.context;
    if (!uservoiceSSOKey) {
      return;
    }

    const token = jwt.sign(
      { guid: user.id, email: user.email, trusted: true },
      uservoiceSSOKey,
      {
        algorithm: "HS256",
      }
    );

    return token;
  }

  public async get(userId: string) {
    const { tenantId } = this.context;

    // validate requested user resource belongs to the tenant
    const accessRight = await getAccessRight({
      tenantId,
      userId,
    });
    if (!accessRight) {
      throw new ForbiddenError("Forbidden");
    }

    const user = await getUser(userId);
    return this.map(user);
  }

  public async setRole(userId: string, role: string) {
    const { tenantId, userId: requesterId } = this.context;

    // validate requested user resource belongs to the tenant
    const accessRight = await getAccessRight({
      tenantId,
      userId,
    });
    if (!accessRight) {
      throw new ForbiddenError("Forbidden");
    }

    await setRole(tenantId, userId, role, requesterId);
  }

  public async updateUserDetails(
    userId: string,
    marketingRole: string,
    firstName: string,
    lastName: string
  ) {
    const { tenantId } = this.context;

    // validate requested user resource belongs to the tenant
    const accessRight = await getAccessRight({
      tenantId,
      userId,
    });
    if (!accessRight) {
      throw new ForbiddenError("Forbidden");
    }

    await updateUserDetails(
      firstName,
      lastName,
      marketingRole,
      tenantId,
      userId
    );
  }

  protected map = (user: IUser) => {
    if (!user) {
      return null;
    }

    return {
      created: user.created,
      email: user.email,
      emailVerified: user.email_verified,
      enabled: user.enabled,
      id: createEncodedId(user.id, this.objtype),
      provider: user.provider,
      userId: user.id,
    };
  };
}
