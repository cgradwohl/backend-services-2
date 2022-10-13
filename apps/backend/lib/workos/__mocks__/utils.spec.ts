const actual = jest.requireActual("~/lib/workos/utils");
export const getCognitoUserByEmail = jest.fn(() =>
  Promise.resolve({ id: "me" })
);
export const getIsUserActive = jest.fn(() => true);
export const getEmailFromWorkOSUserData = actual.getEmailFromWorkOSUserData;
