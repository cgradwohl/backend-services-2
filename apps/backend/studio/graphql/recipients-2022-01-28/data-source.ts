import { IListRecipient, IUserRecipient } from "./../../../types.api.d";
import { decode } from "~/lib/base64";
import { search as recipientSearch } from "~/lib/elastic-search/recipients/recipients";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { NotFound } from "~/lib/http-errors";
import { IRecipient, RecipientType } from "~/types.api";
import {
  deleteProfile,
  get,
  IProfileObject,
  update,
} from "~/lib/dynamo/profiles";
import createEncodedId from "../lib/create-encoded-id";
import DataSource from "../lib/data-source";
import { getSubscription, getSubscriptions, subscribe } from "~/lib/lists";

export interface sortBy {
  id: string;
  desc: boolean;
}
export interface IRecipientSearchInput {
  after: string;
  first: number;
  search: {
    text: string;
    filterTypes: RecipientType[];
    sortBy?: sortBy;
  };
}

export default class Recipients_2022_01_28_DataSource extends DataSource {
  get objtype(): string {
    return "recipient_2022_01_28";
  }

  public async addUsersToList(
    listId: string,
    studioUserId: string,
    users: string[]
  ) {
    const envScopedTenantId = this.getEnvScopedTenantId();

    await Promise.all(
      users.map((recipientId) =>
        subscribe(envScopedTenantId, studioUserId, listId, recipientId)
      )
    );
  }

  public async set(
    userRecipientId: string,
    userRecipientInputData: IUserRecipient
  ) {
    const tenantId = this.getEnvScopedTenantId();
    try {
      const updatedFields = {
        ...userRecipientInputData,
        address: userRecipientInputData?.address ?? {},
      };

      return update(tenantId, userRecipientId, {
        json: updatedFields,
      }).then(() => ({ recipientId: userRecipientId, ...updatedFields }));
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  public async deleteUserRecipient(recipientId: string) {
    try {
      const tenantId = this.getEnvScopedTenantId();
      await deleteProfile(tenantId, recipientId);
      return { status: true };
    } catch (err) {
      if (err instanceof NotFound) {
        return { status: false };
      }
      throw err;
    }
  }

  public async get(recipientId: string) {
    try {
      const tenantId = this.getEnvScopedTenantId();
      const recipient = await get(tenantId, recipientId);

      return this.map(recipient);
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  public async getListRecipient(listRecipientId: string) {
    try {
      const tenantId = this.getEnvScopedTenantId();

      const listRecipients = await recipientSearch({
        tenantId,
        text: listRecipientId,
        filterTypes: ["list"],
      });

      if (!listRecipients?.items?.length) {
        return null;
      }

      return this.mapListRecipientFromEs(
        listRecipients.items[0] as IListRecipient
      );
    } catch (err) {
      if (err instanceof NotFound) {
        return null;
      }
      throw err;
    }
  }

  public async getListRecipientUsers(
    listId: string,
    after?: DocumentClient.Key
  ) {
    try {
      const tenantId = this.getEnvScopedTenantId();
      let options = {
        limit: 25,
        exclusiveStartKey: after,
      };

      const { items: listSubscriptions, lastEvaluatedKey } =
        await getSubscriptions(tenantId, listId, options);

      if (!listSubscriptions?.length) {
        return [];
      }

      const listUsers = await Promise.all(
        listSubscriptions.map(async (subscription) => {
          const recipient = await get(tenantId, subscription.recipientId);
          return this.mapListRecipientUser(subscription.recipientId, recipient);
        })
      );

      return {
        userRecipients: listUsers,
        after: lastEvaluatedKey,
      };
    } catch (err) {
      if (err instanceof NotFound) {
        return [];
      }
      throw err;
    }
  }

  public async getUsersToAddToList(searchTerm: string, listId: string) {
    const tenantId = this.getEnvScopedTenantId();

    const recipients = await recipientSearch({
      filterTypes: ["user"],
      sortBy: {
        id: "recipientId",
        desc: false,
      },
      tenantId,
      text: searchTerm,
    });

    if (!recipients?.items?.length) {
      return { users: [] };
    }

    const users = recipients.items.map(async (recipient) => {
      const { id, name } = recipient as IUserRecipient;
      const recipientElasticId = decode(id);

      const recipientId = recipientElasticId.includes("/")
        ? (recipientElasticId as string).split("/").pop()
        : id;

      let alreadyInList = true;
      try {
        await getSubscription(tenantId, listId, recipientId);
      } catch (err) {
        if (err instanceof NotFound) {
          alreadyInList = false;
        }
      }

      return {
        id: createEncodedId(recipientId, this.objtype),
        name,
        recipientId,
        alreadyInList,
      };
    });

    return {
      users,
    };
  }

  public async list(searchInput?: IRecipientSearchInput) {
    const tenantId = this.getEnvScopedTenantId();
    const { after, first = 25, search } = searchInput;

    const recipients = await recipientSearch({
      filterTypes: search?.filterTypes,
      limit: first,
      next: after ? decode(after) : undefined,
      sortBy: search?.sortBy,
      tenantId,
      text: search?.text,
    });

    if (!recipients?.items?.length) {
      return { items: [] };
    }

    return {
      items: recipients.items.map(this.mapFromEs),
      next: recipients?.next,
      prev: recipients?.prev,
    };
  }

  protected map = (profile: IProfileObject) => {
    if (!profile) {
      return null;
    }
    const { id, json, updated } = profile;
    const data = typeof json === "string" ? JSON.parse(json) : json;
    const fields = Object.entries(data ?? {}).map(([key, value]) => ({
      key,
      value,
    }));

    return {
      id: createEncodedId(id, this.objtype),
      profile: {
        fields,
      },
      recipientId: id,
      updated_at: updated,
    };
  };

  protected mapListRecipientUser = (
    recipientId: string,
    profile: IProfileObject
  ) => {
    if (!profile) {
      return {
        id: createEncodedId(recipientId, this.objtype),
        recipientId,
      };
    }
    const { id, json, updated } = profile;
    const data = typeof json === "string" ? JSON.parse(json) : json;

    return {
      id: createEncodedId(id, this.objtype),
      name: data.name,
      email: data.email,
      phone_number: data.phone_number,
      recipientId: id,
      updated_at: updated,
    };
  };

  private mapFromEs = (recipient: IRecipient) => {
    if (!recipient) {
      return null;
    }

    const { email, phone_number } = recipient as IUserRecipient;
    const { id, updated_at, last_sent_at, name, type } = recipient;
    const recipientElasticId = decode(id);

    const recipientId = recipientElasticId.includes("/")
      ? (recipientElasticId as string).split("/").pop()
      : id;

    return {
      email,
      id: createEncodedId(recipientId, this.objtype),
      last_sent_at,
      name,
      phone_number,
      recipientId,
      type,
      updated_at,
    };
  };

  private mapListRecipientFromEs = async (recipient: IListRecipient) => {
    if (!recipient) {
      return null;
    }

    const { id, updated_at, last_sent_at, name, type, count } = recipient;

    const recipientElasticId = decode(id);

    const recipientId = recipientElasticId.includes("/")
      ? (recipientElasticId as string).split("/").pop()
      : id;

    return {
      id: createEncodedId(recipientId, this.objtype),
      last_sent_at,
      name,
      recipientId,
      type,
      updated_at,
      count: count ?? 0,
    };
  };
}
