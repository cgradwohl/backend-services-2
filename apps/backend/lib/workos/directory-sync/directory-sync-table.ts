import { getItem, put, deleteItem } from "../../dynamo";

/** directoryId/"tenant" */
type DirectorySyncTenantKey = `${string}/tenant`;

/** <directoryId>/user/<idpUserId> */
type DirectorySyncUserKey = `${string}/user/${string}`;

export type DirectorySyncTenantMap = {
  pk: DirectorySyncTenantKey;
  tenantId: string;
};

export type DirectorySyncUser = {
  pk: DirectorySyncUserKey;
  state: "active" | "suspended" | "inactive";
  role: string;
  tenantId: string;
  /** Time the user was last updated */
  updated: number;
};

export const getDirectorySyncTenantMap = async (
  directoryId: string
): Promise<DirectorySyncTenantMap | undefined> => {
  const directoryResponse = await getItem({
    Key: { pk: getDirectorySyncTenantKey(directoryId) },
    TableName: process.env.DIRECTORY_SYNC_TABLE_NAME,
  });

  return directoryResponse?.Item as DirectorySyncTenantMap | undefined;
};

export const putDirectorySyncTenantMap = async (
  directoryId: string,
  tenantId: string
): Promise<void> => {
  await put({
    Item: { pk: getDirectorySyncTenantKey(directoryId), tenantId },
    TableName: process.env.DIRECTORY_SYNC_TABLE_NAME,
  });
};

export const deleteDirectorySyncUser = async (
  directoryId: string,
  idpUserId: string
): Promise<void> => {
  await deleteItem({
    Key: { pk: getDirectorySyncUserKey(directoryId, idpUserId) },
    TableName: process.env.DIRECTORY_SYNC_TABLE_NAME,
  });
};

export const putDirectorySyncUser = async ({
  directoryId,
  idpUserId,
  state,
  role,
  tenantId,
  updated,
}: {
  directoryId: string;
  idpUserId: string;
  state: "active" | "suspended";
  role: string;
  tenantId: string;
  updated: number;
}): Promise<void> => {
  await put({
    Item: {
      pk: getDirectorySyncUserKey(directoryId, idpUserId),
      state,
      role,
      tenantId,
      updated,
    },
    TableName: process.env.DIRECTORY_SYNC_TABLE_NAME,
  });
};

export const getDirectorySyncUser = async (
  directoryId: string,
  idpUserId: string
): Promise<DirectorySyncUser | undefined> => {
  const directoryResponse = await getItem({
    Key: { pk: getDirectorySyncUserKey(directoryId, idpUserId) },
    TableName: process.env.DIRECTORY_SYNC_TABLE_NAME,
  });

  return directoryResponse?.Item as DirectorySyncUser | undefined;
};

function getDirectorySyncTenantKey(
  directoryId: string
): DirectorySyncTenantKey {
  return `${directoryId}/tenant`;
}

function getDirectorySyncUserKey(
  directoryId: string,
  idpUserId: string
): DirectorySyncUserKey {
  return `${directoryId}/user/${idpUserId}`;
}
