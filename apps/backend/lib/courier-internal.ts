import { getUser } from "./cognito";

export const hasCourierEmail = (email: string) => {
  return email.endsWith("@trycourier.com") || email.endsWith("@courier.com");
};

export const isCourierUser = async (userId: string) => {
  const user = await getUser(userId);
  return hasCourierEmail(user?.email);
};
