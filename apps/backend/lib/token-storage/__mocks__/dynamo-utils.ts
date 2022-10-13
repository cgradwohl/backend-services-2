const original = jest.requireActual("../dynamo-utils");
export const getPk = jest.fn(original.getPk);
export const getGsi1Pk = jest.fn(original.getGsi1Pk);
export const getGsi2Pk = jest.fn(({ tenantId }) => `${tenantId}/10`);
export const dynamoItemFromWritableRecipientToken = jest.fn((token: any) => ({
  ...original.dynamoItemFromWritableRecipientToken(token),
  gsi2pk: getGsi2Pk({ tenantId: token.tenantId }),
}));
export const dynamoItemToRecipientToken = jest.fn(
  original.dynamoItemToRecipientToken
);
